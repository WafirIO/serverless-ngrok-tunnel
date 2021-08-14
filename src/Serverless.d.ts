/// <reference types="ngrok" />
/*
 * Copyright 2019 Graphcool, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

declare namespace Serverless {
    interface Instance {
        cli: {
            log(str: string): void
        }

        config: {
            servicePath: string
        }

        service: {
            provider: {
                name: string
            }
            functions: {
                [key: string]: Serverless.Function
            }
            package: Serverless.Package
            custom?: Record<string, any>
            getAllFunctions(): string[]
        }


        pluginManager: PluginManager
    }

    interface Options {
        function?: string
        watch?: boolean
        extraServicePath?: string
    }

    interface Function {
        handler: string
        package: Serverless.Package
    }

    interface Package {
        include: string[]
        exclude: string[]
        patterns: string[]
        artifact?: string
        individually?: boolean
    }

    interface PluginManager {
        spawn(command: string): Promise<void>
    }

    type LifecycleEvents = 'functions' | 'resources' | 'init' | 'serverless'
    type CommandOptions = {
        usage: string
        shortcut?: string
        required?: boolean
        type: 'string' | 'boolean' | 'multiple'
    }
    type CommandDefinition = {
        lifecycleEvents: LifecycleEvents[]
        options?: Record<string, CommandOptions>
    }

    /**
     * @see {@link https://www.serverless.com/framework/docs/providers/aws/guide/plugins#lifecycle-events Lifecycle Events}
     */
    type LifecycleEventName<C extends string = string, E extends LifecycleEvents = LifecycleEvents> =
        | `before:${C}:${E}`
        | `${C}:${E}`
        | `after:${C}:${E}`
    interface Plugin<Commands extends string = string> {
        // new(serverless: Instance, options: Options): Plugin

        /**
         * A CLI Command that can be called by a user, e.g. `serverless foo`. A
         * Command has no logic, but simply defines the CLI configuration (e.g.
         * command, parameters) and the _Lifecycle Events_ for the command. Every
         * command defines its own lifecycle events.
         *
         * @see {@link https://www.serverless.com/framework/docs/providers/aws/guide/plugins#command Commands}
         */
        commands?: Record<string, any>

        /**
         * A Hook binds code to any lifecycle event from any command.
         *
         * @see {@link https://www.serverless.com/framework/docs/providers/aws/guide/plugins#hooks Hooks}
         */
        hooks?: Record<LifecycleEventName<Commands>, () => any>

        /**
         * @see {@link https://www.serverless.com/framework/docs/providers/aws/guide/plugins#custom-variable-types Custom Variable Types}
         */
        configurationVariablesSources?: Record<string, any>
    }
}
