import ngrok, { Ngrok } from 'ngrok'
import envFile from 'envfile'
import fs from 'fs'
import path from 'path'
import assert from 'assert'

export interface TunnelOptions {
  port: number
  /** Property in .env file to assign url value to  */
  envProp?: string
  /**
   * Expose web socket url
   * @default false
   */
  ws?: boolean
  /**
   * Additional path for url
   */
  path?: string
  ngrokOptions?: Ngrok.Options
}
export interface ServerlessTunnelOptions {
  /**
   * Path to your .env file, relative to serverless.yml file.
   */
  envPath?: string
  tunnels: TunnelOptions[]
}

type CustomServerlessTunnelOptions = Serverless.Options & { tunnel: ServerlessTunnelOptions | 'true' }
/**
 * Creates public tunnels for provided ports on localhost. Also, writes tunnels url to .env file and deletes them after session is over.
 */
export default class ServerlessTunnel implements Serverless.Plugin {
  private serverless: Serverless.Instance
  private log: (str: string) => void
  private slsOptions: Serverless.Options & CustomServerlessTunnelOptions
  private reconnectTried: boolean
  private noEnvFile: boolean
  /** path to .env file where url is written. */
  private envPath: string | undefined
  private envContent: Record<string, string>
  private options: ServerlessTunnelOptions

  public commands: Record<string, any>
  public hooks:Record<Serverless.LifecycleEventName, () => any>

  constructor (serverless: Serverless.Instance, options: CustomServerlessTunnelOptions) {
    this.serverless = serverless
    this.log = serverless.cli.log.bind(serverless.cli)
    this.slsOptions = options
    this.reconnectTried = false
    this.noEnvFile = true
    this.envContent = {}
    this.options = {} as ServerlessTunnelOptions

    this.commands = {
      tunnel: {
        lifecycleEvents: ['init']
      }
    }

    // Run tunnels after serverless-offline
    this.hooks = {
      'tunnel:init': this.runServer.bind(this, true),
      'before:offline:start:init': this.runServer.bind(this)
    }
  }

  // async runTunnel ({port, envProp, ws, path, ngrokOptions}: { port: number, envProp: any, ws: any, path: any, ngrokOptions: Ngrok.Options }) {
  async runTunnel ({port, envProp, ws = false, path, ngrokOptions}: TunnelOptions) {
    try {
      const url = await ngrok.connect({
        addr: port,
        proto: 'http',
        region: 'eu',
        ...(ngrokOptions || {}),
        onStatusChange: status => status === 'closed' ? this.onTunnelClose() : undefined,
        onLogEvent: this.log
      });

      this.onConnect(url, envProp, ws, path)

    } catch (e) {
      this.errorHandler(e)
    }
  }

  onConnect (url: string, envProp: string | undefined, ws: boolean, path: string | undefined) {
    const tunnel = ws ? url.replace('http', 'ws') : url
    if (envProp) {
      this.envContent[envProp] = `${tunnel}${path || ''}`
      this.log(`${envProp} available at: ${this.envContent[envProp]}`)
    } else {
      this.log(`Tunnel created at ${tunnel}${path || ''}`)
    }
    this.writeToEnv()
  }

  errorHandler (e: Error) {
    this.log(`Tunnels error: ${e.message}. Trying to reconnect in 5 seconds...`)
    this.tryReconnect()
  }

  onTunnelClose () {
    this.log('Closing tunnels...')
  }

  runServer (selfInit: boolean) {
    // this.options = _.get(this.serverless, 'service.custom.ngrokTunnel', {})
    this.options = this.serverless.service.custom?.ngrokTunnel ?? {}

    if (this.options.envPath) {
      this.noEnvFile = false
      this.envPath = path.resolve(process.cwd(), this.options.envPath)

      try {
        this.envContent = envFile.parse(this.envPath)
      } catch (e) {
        this.envContent = {}
        this.noEnvFile = true
      }
    }
    if (this.slsOptions.tunnel === 'true' || selfInit) {
      if (this.options.tunnels && this.options.tunnels.length) {
        this.log('Starting tunnels...')
        this.options.tunnels.forEach((opt) => this.runTunnel(opt))
        process.on('SIGINT', () => this.stopTunnel())
      } else {
        this.log('Tunnels are not configured. Skipping...')
      }
    }
  }

  async stopTunnel () {
    await ngrok.kill()
    if (!this.noEnvFile) {
      this.options.tunnels?.forEach(({envProp}) => {
        envProp && delete this.envContent[envProp]
      })
      await this.writeToEnv()
    }
  }

  tryReconnect () {
    if (!this.reconnectTried) {
      setTimeout(() => {
        this.options.tunnels?.forEach((opt) => this.runTunnel(opt))
      }, 5000)
      this.reconnectTried = true
    }
  }

  async writeToEnv () {
    if (!this.noEnvFile) {
      await fs.promises.writeFile(this.envPath!, envFile.stringify(this.envContent))
    }
  }
}
