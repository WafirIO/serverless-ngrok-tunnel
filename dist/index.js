"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ngrok_1 = __importDefault(require("ngrok"));
const envfile_1 = __importDefault(require("envfile"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class ServerlessTunnel {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.log = serverless.cli.log.bind(serverless.cli);
        this.slsOptions = options;
        this.reconnectTried = false;
        this.noEnvFile = true;
        this.envContent = {};
        this.options = {};
        this.commands = {
            tunnel: {
                lifecycleEvents: ['init']
            }
        };
        this.hooks = {
            'tunnel:init': this.runServer.bind(this, true),
            'before:offline:start:init': this.runServer.bind(this)
        };
    }
    runTunnel({ port, envProp, ws = false, path, ngrokOptions }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const url = yield ngrok_1.default.connect(Object.assign(Object.assign({ addr: port, proto: 'http', region: 'eu' }, (ngrokOptions || {})), { onStatusChange: status => status === 'closed' ? this.onTunnelClose() : undefined, onLogEvent: this.log }));
                this.onConnect(url, envProp, ws, path);
            }
            catch (e) {
                this.errorHandler(e);
            }
        });
    }
    onConnect(url, envProp, ws, path) {
        const tunnel = ws ? url.replace('http', 'ws') : url;
        if (envProp) {
            this.envContent[envProp] = `${tunnel}${path || ''}`;
            this.log(`${envProp} available at: ${this.envContent[envProp]}`);
        }
        else {
            this.log(`Tunnel created at ${tunnel}${path || ''}`);
        }
        this.writeToEnv();
    }
    errorHandler(e) {
        this.log(`Tunnels error: ${e.message}. Trying to reconnect in 5 seconds...`);
        this.tryReconnect();
    }
    onTunnelClose() {
        this.log('Closing tunnels...');
    }
    runServer(selfInit) {
        var _a, _b;
        this.options = (_b = (_a = this.serverless.service.custom) === null || _a === void 0 ? void 0 : _a.ngrokTunnel) !== null && _b !== void 0 ? _b : {};
        if (this.options.envPath) {
            this.noEnvFile = false;
            this.envPath = path_1.default.resolve(process.cwd(), this.options.envPath);
            try {
                this.envContent = envfile_1.default.parse(this.envPath);
            }
            catch (e) {
                this.envContent = {};
                this.noEnvFile = true;
            }
        }
        if (this.slsOptions.tunnel === 'true' || selfInit) {
            if (this.options.tunnels && this.options.tunnels.length) {
                this.log('Starting tunnels...');
                this.options.tunnels.forEach((opt) => this.runTunnel(opt));
                process.on('SIGINT', () => this.stopTunnel());
            }
            else {
                this.log('Tunnels are not configured. Skipping...');
            }
        }
    }
    stopTunnel() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            yield ngrok_1.default.kill();
            if (!this.noEnvFile) {
                (_a = this.options.tunnels) === null || _a === void 0 ? void 0 : _a.forEach(({ envProp }) => {
                    envProp && delete this.envContent[envProp];
                });
                yield this.writeToEnv();
            }
        });
    }
    tryReconnect() {
        if (!this.reconnectTried) {
            setTimeout(() => {
                var _a;
                (_a = this.options.tunnels) === null || _a === void 0 ? void 0 : _a.forEach((opt) => this.runTunnel(opt));
            }, 5000);
            this.reconnectTried = true;
        }
    }
    writeToEnv() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.noEnvFile) {
                yield fs_1.default.promises.writeFile(this.envPath, envfile_1.default.stringify(this.envContent));
            }
        });
    }
}
exports.default = ServerlessTunnel;
//# sourceMappingURL=index.js.map