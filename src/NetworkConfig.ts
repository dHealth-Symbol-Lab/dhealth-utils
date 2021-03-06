/*
 * Copyright 2020 NEM (https://nem.io)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 *
 */

export interface NodeConfig {
    roles: number;
    friendlyName: string;
    url: string;
}

export interface NetworkConfigurationDefaults {
    maxTransactionsPerAggregate: number;
    maxMosaicDuration: number;
    lockedFundsPerAggregate: string;
    maxNamespaceDuration: number;
    maxCosignatoriesPerAccount: number;
    maxMosaicAtomicUnits: number;
    blockGenerationTargetTime: number;
    currencyMosaicId: string;
    namespaceGracePeriodDuration: number;
    harvestingMosaicId: string;
    minNamespaceDuration: number;
    maxCosignedAccountsPerAccount: number;
    maxNamespaceDepth: number;
    defaultDynamicFeeMultiplier: number;
    maxMosaicDivisibility: number;
    maxMessageSize: number;
    epochAdjustment: number;
    totalChainImportance: number;
    generationHash: string;
}

export interface NetworkConfig {
    faucetUrl: string;
    nodes: NodeConfig[];
    defaultNetworkType: number;
    explorerUrl: string;
    networkConfigurationDefaults: NetworkConfigurationDefaults;
}

export const defaultTestnetNetworkConfig: NetworkConfig = {
    explorerUrl: 'https://explorer-01.dhealth.dev:82/',
    faucetUrl: 'http://faucet-preview.testnet.symboldev.network/',
    defaultNetworkType: 152,
    networkConfigurationDefaults: {
        maxMosaicDivisibility: 6,
        namespaceGracePeriodDuration: 31540000,
        lockedFundsPerAggregate: '10000000',
        maxCosignatoriesPerAccount: 25,
        blockGenerationTargetTime: 30,
        maxNamespaceDepth: 3,
        maxMosaicDuration: 315360000,
        minNamespaceDuration: 315360000,
        maxNamespaceDuration: 315360000,
        maxTransactionsPerAggregate: 100,
        maxCosignedAccountsPerAccount: 25,
        maxMessageSize: 1024,
        maxMosaicAtomicUnits: 9000000000000000,
        currencyMosaicId: '5A4935C1D66E6AC4',
        harvestingMosaicId: '5A4935C1D66E6AC4',
        defaultDynamicFeeMultiplier: 100,
        epochAdjustment: 1616978397,
        totalChainImportance: 1000000000000000,
        generationHash: 'F1DE7701FF17DA20904565FA9753690A9990D3B00730A241FFFB7F60C2B5D638',
    },
    nodes: [
        { friendlyName: 'dual-01-dhealth-testnet', roles: 2, url: 'https://dual-01.dhealth.dev:3001' },
        { friendlyName: 'dual-02-dhealth-testnnet', roles: 2, url: 'https://dual-02.dhealth.dev:3001' }
    ],
};

export const defaultMainnetNetworkConfig: NetworkConfig = {
    explorerUrl: 'http://explorer.dhealth.cloud/',
    faucetUrl: 'http://faucet.mainnet.symboldev.network/',
    defaultNetworkType: 104,
    networkConfigurationDefaults: {
        maxMosaicDivisibility: 6,
        namespaceGracePeriodDuration: 31540000,
        lockedFundsPerAggregate: '10000000',
        maxCosignatoriesPerAccount: 25,
        blockGenerationTargetTime: 30,
        maxNamespaceDepth: 3,
        maxMosaicDuration: 315360000,
        minNamespaceDuration: 315360000,
        maxNamespaceDuration: 315360000,
        maxTransactionsPerAggregate: 100,
        maxCosignedAccountsPerAccount: 25,
        maxMessageSize: 1024,
        maxMosaicAtomicUnits: 9000000000000000,
        currencyMosaicId: '39E0C49FA322A459',
        harvestingMosaicId: '39E0C49FA322A459',
        defaultDynamicFeeMultiplier: 100,
        epochAdjustment: 1616978397,
        totalChainImportance: 1000000000000000,
        generationHash: 'ED5761EA890A096C50D3F50B7C2F0CCB4B84AFC9EA870F381E84DDE36D04EF16',
    },
    nodes: [
        { friendlyName: 'dual-01-dhealth', roles: 2, url: 'http://dual-01.dhealth.cloud:3000' },
        { friendlyName: 'dual-02-dhealth', roles: 2, url: 'http://dual-02.dhealth.cloud:3000' },
        { friendlyName: 'dual-03-dhealth', roles: 2, url: 'http://dual-03.dhealth.cloud:3000' }
    ],
};

const defaultNetworkConfig: Record<number, NetworkConfig> = {
    152: defaultTestnetNetworkConfig,
    104: defaultMainnetNetworkConfig
};

export const networks = defaultNetworkConfig;