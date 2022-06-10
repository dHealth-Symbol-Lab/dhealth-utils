import { NetworkType, UInt64 } from '@dhealth/sdk';
import { NetworkConfig } from './';
const axios = require('axios');

export class NetworkUtil {
  public static async getNodeFromNetwork(networkType: NetworkType) {
    const available_nodes =
      this.isSecureConnection() ?
        NetworkConfig.networks[networkType].httpsNodes :
        NetworkConfig.networks[networkType].nodes;
    for (const node of available_nodes) {
      const nodeIsUp = await this.nodeIsUp(node.url);
      if (nodeIsUp) {
        return node;
      }
    }
    throw new Error(`No available node from network ${networkType}`);
  }

  public static async nodeIsUp(nodeUrl: string) {
    nodeUrl = nodeUrl.replace(/\/$/, '');
    const res = await axios.get(`${nodeUrl}/node/health`).catch(() => {
      return false;
    });
    if (res.data && res.data.status.apiNode === 'up' && res.data.status.db === 'up') {
      return true;
    }
    return false;
  }

  public static getNetworkTypeFromAddress(rawAddress: string) {
    return rawAddress.substring(0, 1) === 'T' ? NetworkType.TEST_NET : NetworkType.MAIN_NET;
  }

  /**
	 * convet network timestamp to world time
   * @param networkType - network type
	 * @param timestamp - raw timestamp
	 * @returns timestamp - world timestamp
	 */
	public static getNetworkTimestampFromUInt64(networkType: NetworkType, timestamp: UInt64) {
    const timestampNumber = Number(timestamp.toString());
    return this.getNetworkTimestampFromRaw(networkType, timestampNumber);
  }

  /**
	 * convet network timestamp to world time
   * @param networkType - network type
	 * @param timestamp - raw timestamp
	 * @returns timestamp - world timestamp
	 */
  public static getNetworkTimestampFromRaw(networkType: NetworkType, timestamp: number) {
    return Math.round(timestamp / 1000) + NetworkConfig.networks[networkType].networkConfigurationDefaults.epochAdjustment;
  }

  public static isSecureConnection() {
    return typeof process !== 'object' && typeof window !== "undefined" && window.location.protocol === 'https:';
  }
}