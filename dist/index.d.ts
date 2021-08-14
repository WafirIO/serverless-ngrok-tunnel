import { Ngrok } from 'ngrok';
export interface TunnelOptions {
    port: number;
    envProp?: string;
    ws?: boolean;
    path?: string;
    ngrokOptions?: Ngrok.Options;
}
export interface ServerlessTunnelOptions {
    envPath?: string;
    tunnels: TunnelOptions[];
}
declare type CustomServerlessTunnelOptions = Serverless.Options & {
    tunnel: ServerlessTunnelOptions | 'true';
};
export default class ServerlessTunnel implements Serverless.Plugin {
    private serverless;
    private log;
    private slsOptions;
    private reconnectTried;
    private noEnvFile;
    private envPath;
    private envContent;
    private options;
    commands: Record<string, any>;
    hooks: Record<Serverless.LifecycleEventName, () => any>;
    constructor(serverless: Serverless.Instance, options: CustomServerlessTunnelOptions);
    runTunnel({ port, envProp, ws, path, ngrokOptions }: TunnelOptions): Promise<void>;
    onConnect(url: string, envProp: string | undefined, ws: boolean, path: string | undefined): void;
    errorHandler(e: Error): void;
    onTunnelClose(): void;
    runServer(selfInit: boolean): void;
    stopTunnel(): Promise<void>;
    tryReconnect(): void;
    writeToEnv(): Promise<void>;
}
export {};
