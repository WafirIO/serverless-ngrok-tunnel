import { Ngrok } from 'ngrok';
export interface TunnelOptions {
    port: number;
    /** Property in .env file to assign url value to  */
    envProp?: string;
    /**
     * Expose web socket url
     * @default false
     */
    ws?: boolean;
    /**
     * Additional path for url
     */
    path?: string;
    ngrokOptions?: Ngrok.Options;
}
export interface ServerlessTunnelOptions {
    /**
     * Path to your .env file, relative to serverless.yml file.
     */
    envPath?: string;
    tunnels: TunnelOptions[];
}
declare type CustomServerlessTunnelOptions = Serverless.Options & {
    tunnel: ServerlessTunnelOptions | 'true';
};
/**
 * Creates public tunnels for provided ports on localhost. Also, writes tunnels url to .env file and deletes them after session is over.
 */
export default class ServerlessTunnel implements Serverless.Plugin {
    private serverless;
    private log;
    private slsOptions;
    private reconnectTried;
    private noEnvFile;
    /** path to .env file where url is written. */
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
