import {
    Account,
    Address,
    Deadline,
    Mosaic,
    MosaicId,
    NamespaceId,
    NetworkType,
    PlainMessage,
    RepositoryFactoryHttp,
    SignedTransaction,
    Transaction,
    TransactionAnnounceResponse,
    TransactionGroup,
    TransactionMapping,
    TransactionSearchCriteria,
    TransactionService,
    TransactionStatusError,
    TransactionType,
    TransferTransaction,
    UInt64
} from '@dhealth/sdk';
import { TransactionURI } from 'symbol-uri-scheme';

import {
    AccountUtil,
    BlockchainUtil,
    MosaicUtil,
    NetworkConfig,
    NetworkUtil
} from './'
import { mergeMap, filter, toArray, tap, map } from 'rxjs/operators';
import { TransactionCreationParams, TransactionStrategies } from './infrastructure';
import { merge } from 'rxjs/internal/observable/merge';
import { UniRepositoryFactoryHttp } from './infrastructure/web-socket/UniRepositoryFactoryHttp';

export class TransactionUtil {

    public static createTransaction(Clazz: any, transactionCreationParams: TransactionCreationParams) {
        const txStrategy = TransactionStrategies.getStrategy(Clazz.name);
        return txStrategy.create(transactionCreationParams);
    }

    public static async createAndAnnounceTransaction
    (
        Clazz: any,
        transactionCreationParams: TransactionCreationParams,
        privateKey: string
    ) {
        const transaction = TransactionUtil.createTransaction(Clazz, transactionCreationParams);
        const account = Account.createFromPrivateKey(privateKey, transactionCreationParams.networkType);
        const signedTransaction = await this.signTransaction(account, transaction);
        const response = (await this.announceTransaction(signedTransaction));
        return response;
    }

    public static async createAndAnnounceTransactionSync
    (
        Clazz: any,
        transactionCreationParams: TransactionCreationParams,
        privateKey: string,
    ) {
        const transaction = TransactionUtil.createTransaction(Clazz, transactionCreationParams);
        const account = Account.createFromPrivateKey(privateKey, transactionCreationParams.networkType);
        const signedTransaction = await this.signTransaction(account, transaction);
        const response = (await this.announceTransactionSync(account, signedTransaction));
        return response;
    }

    public static getMosaicFromId(mosaicId: string, amount: number) {
        const aliasedMosaic = new Mosaic(
            new MosaicId(mosaicId), UInt64.fromUint(amount)
        );
        return aliasedMosaic;
    }

    public static getMosaicFromNamespace(namespaceId: string, amount: number) {
        const aliasedMosaic = new Mosaic(
            new NamespaceId(namespaceId),
            UInt64.fromUint(amount),
        );
        return aliasedMosaic;
    }

    public static async createTransferTransaction(networkType: NetworkType, recipientAddress: string, aliasedMosaics: Mosaic[], plainMessage: string, maxFee: number) {
        return TransferTransaction.create(
            Deadline.create(NetworkConfig.networks[networkType].networkConfigurationDefaults.epochAdjustment),
            Address.createFromRawAddress(recipientAddress),
            aliasedMosaics,
            PlainMessage.create(plainMessage),
            networkType,
            UInt64.fromUint(maxFee),
        );
    }

    public static async signTransaction(account: Account, transaction: Transaction) {
        const networkType = transaction.networkType;
        const networkGenerationHash = NetworkConfig.networks[networkType].networkConfigurationDefaults.generationHash;
        const signedTransaction = account.sign(
            transaction,
            networkGenerationHash,
        );
        return signedTransaction;
    }

    public static async announceTransaction(
        signedTransaction: SignedTransaction
    ): Promise<TransactionAnnounceResponse> {
        const networkType = signedTransaction.networkType;
        const node = await NetworkUtil.getNodeFromNetwork(networkType);
        const repositoryFactory = new UniRepositoryFactoryHttp(node.url);
        const transactionHttp = repositoryFactory.createTransactionRepository();
        const response = transactionHttp.announce(signedTransaction)
        return response.toPromise();
    }

    public static async announceTransactionSync(
        account: Account, signedTransaction: SignedTransaction
    ): Promise<Transaction | TransactionStatusError> {
        const networkType = signedTransaction.networkType;
        const node = await NetworkUtil.getNodeFromNetwork(networkType);
        const repositoryFactory = new UniRepositoryFactoryHttp(node.url);
        const transactionHttp = repositoryFactory.createTransactionRepository();
        const receiptHttp = repositoryFactory.createReceiptRepository();
        const listener = repositoryFactory.createListener();
        const transactionService = new TransactionService(transactionHttp, receiptHttp);
        const result = await this.announceTransactionSyncAndGetResult(
            listener, transactionService, signedTransaction, account
        );
        return result;
    }

    private static async announceTransactionSyncAndGetResult(
        listener: any, transactionService: any, signedTransaction: any, account: any
    ) {
        return listener.open()
            .then(() => new Promise((resolve, reject) =>
                merge(...[
                    transactionService.announce(signedTransaction, listener),
                    listener.status(account.address).pipe(
                        filter((error: any) => error.hash === signedTransaction.hash),
                        tap((error: any) => {
                            throw new Error(error.code);
                        }),
                    )
                ]).subscribe(resolve, reject))
            )
            .then((transaction: Transaction) => {
                listener.close();
                return transaction;
            }).catch((err: Error) => {
                listener.close();
                throw err;
            })
    }

    /**
     * More about TransactionSearchCriteria:
     * https://docs.symbolplatform.com/symbol-sdk-typescript-javascript/1.0.1/interfaces/infrastructure_searchcriteria_transactionsearchcriteria.transactionsearchcriteria.html
     * @param networkType
     * @param searchCriteria
     * @returns all transactions that meet the search criteria
     */
    public static async getTransactions(networkType: NetworkType ,searchCriteria: TransactionSearchCriteria) {
        const node = await NetworkUtil.getNodeFromNetwork(networkType);
        const repositoryFactory = new RepositoryFactoryHttp(node.url);
        const transactionHttp = repositoryFactory.createTransactionRepository();
        const page = await transactionHttp.search(searchCriteria).toPromise();
        return page.data;
    }

    /**
     * Get incoming transactions from address.
     * @param rawAddress
     * @param group
     * @param pageNumber
     * @param pageSize
     * @param mosaicIdHex
     * @returns all incoming transactions
     */
    public static async getIncomingTransactions(rawAddress: string, group: TransactionGroup, pageNumber: number, pageSize: number, mosaicIdHex?: string) {
        const address = Address.createFromRawAddress(rawAddress);
        const networkType = NetworkUtil.getNetworkTypeFromAddress(rawAddress);
        const node = await NetworkUtil.getNodeFromNetwork(networkType);
        const repositoryFactory = new RepositoryFactoryHttp(node.url);
        const transactionHttp = repositoryFactory.createTransactionRepository();
        const searchCriteria = {
            recipientAddress: address,
            group: group,
            pageNumber: pageNumber,
            pageSize: pageSize,
            mosaicIdHex: mosaicIdHex
        };
        const page = await transactionHttp.search(searchCriteria).toPromise();
        return page.data;
    }

    /**
     * Get outgoing transactions from address.
     * @param rawAddress
     * @param signerPubKey
     * @param group
     * @param pageNumber
     * @param pageSize
     * @param mosaicIdHex
     * @returns all outgoing transactions
     */
    public static async getOutgoingTransactions(rawAddress: string, group: TransactionGroup, pageNumber: number, pageSize: number, mosaicIdHex?: string) {
        const networkType = NetworkUtil.getNetworkTypeFromAddress(rawAddress);
        const node = await NetworkUtil.getNodeFromNetwork(networkType);
        const repositoryFactory = new RepositoryFactoryHttp(node.url);
        const transactionHttp = repositoryFactory.createTransactionRepository();
        const signerPubKey = await AccountUtil.getPublicKeyFromAddress(rawAddress);
        const searchCriteria = {
            signerPublicKey: signerPubKey,
            group: group,
            pageNumber: pageNumber,
            pageSize: pageSize,
            mosaicIdHex: mosaicIdHex
        };
        const page = await transactionHttp.search(searchCriteria).toPromise();
        return page.data;
    }

    public static async getMosaicSent(options: {
        signerPubKey: string, recipientRawAddress: string, mosaicIdHex: string
    }) {
        const networkType = NetworkUtil.getNetworkTypeFromAddress(options.recipientRawAddress);
        const node = await NetworkUtil.getNodeFromNetwork(networkType);
        const signerPublicKey = options.signerPubKey;
        const recipientAddress = options.recipientRawAddress ? Address.createFromRawAddress(options.recipientRawAddress) : undefined;
        const mosaicInfo = await MosaicUtil.getMosaicInfo(networkType, options.mosaicIdHex);
        const divisibility = mosaicInfo.divisibility;
        const mosaicId = options.mosaicIdHex ? new MosaicId(options.mosaicIdHex) : undefined;
        const repositoryFactory = new RepositoryFactoryHttp(node.url);
        const transactionHttp = repositoryFactory.createTransactionRepository();

        const searchCriteria = {
            group: TransactionGroup.Confirmed,
            signerPublicKey,
            recipientAddress,
            pageSize: 100,
            pageNumber: 1,
            type: [TransactionType.TRANSFER],
        };

        transactionHttp
        .search(searchCriteria)
        .pipe(
        map((_) => _.data),
        // Process each transaction individually.
        mergeMap((_) => _),
        // Map transaction as transfer transaction.
        map((_) => _ as TransferTransaction),
        // Filter transactions containing a given mosaic
        filter((_) => mosaicId ? _.mosaics.length === 1 && _.mosaics[0].id.equals(mosaicId) : true),
        // Transform absolute amount to relative amount.
        map((_) => _.mosaics[0].amount.compact() / Math.pow(10, divisibility)),
        // Add all amounts into an array.
        toArray(),
        // Sum all the amounts.
        map((_) => _.reduce((a: any, b: any) => a + b, 0)),
        )
        .subscribe(
            (total) =>
                console.log(
                'Total:',
                total,
                ),
            (err) => console.error(err),
        );
    }

    public static async getTimestampFromTransaction(transaction: Transaction) {
        if (!transaction.transactionInfo) {
            throw new Error("Transaction object doesn't have transactionInfo value");
        }
        const height = transaction.transactionInfo.height;
        const networkType = transaction.networkType;
        const block = await BlockchainUtil.getBlockByHeightUInt64(networkType, height);
        const timestamp = NetworkUtil.getNetworkTimestampFromUInt64(networkType, block.timestamp);
        return timestamp;
    }

    public static transactionToJSON(transaction: Transaction): string {
        const obj = Object.assign(
            transaction.toJSON(),
            {
                transactionInfo: JSON.parse(JSON.stringify(transaction.transactionInfo))
            }
        );
        return JSON.stringify(obj);
    }

    /**
     * Serve transactions ready to be signed.
     * Can be imported in desktop/mobile wallet.
     * @param transaction
     * @returns transaction uri
     */
    public static createTransactionURI(transaction: Transaction) {
        const txURI = new TransactionURI(transaction.serialize(), TransactionMapping.createFromPayload).build();
        const dHealthTxURI = txURI.replace('symbol', 'dhealth');
        return dHealthTxURI;
    }
}