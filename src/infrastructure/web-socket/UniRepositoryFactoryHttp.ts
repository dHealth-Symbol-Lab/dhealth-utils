import { IListener, Listener, RepositoryFactoryHttp } from "@dhealth/sdk";
import WebSocket from 'isomorphic-ws';

export class UniRepositoryFactoryHttp extends RepositoryFactoryHttp {
  createListener(): IListener {
    const websocketInjected = WebSocket;
    if (typeof process !== 'object') {
      (this as any).websocketUrl = 
        (this as any).websocketUrl.replace(
          /^[^:]+/,
          (this as any).websocketUrl.includes('https://') ? 'wss' : 'ws'
        );
    }
    return new Listener(
      (this as any).websocketUrl,
      this.createNamespaceRepository(),
      websocketInjected,
      this.createMultisigRepository()
    );
  }
}