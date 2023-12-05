import {Arguments, Argv} from "yargs";
import * as fs from "fs";
import {IBundle} from "./spec/bundle";

export interface BundleOptions {
    type: 'batch'|'transaction'|'collection';
    path: string;
    pretty: boolean;
}

export class BundleCommand {
    private options: BundleOptions;

    public static command = 'bundle <type> <path>';
    public static description = 'Updates an existing bundle to be a specific type of bundle. If batch or transaction, ensures that all entries have a request';

    public static args(args: Argv): Argv {
        return args
            .positional('type', {
                description: 'The type to set for the bundle',
                type: 'string',
                choices: ['batch', 'transaction', 'collection']
            })
            .positional('path', {
                description: 'The path to the bundle',
                type: 'string'
            })
            .option('pretty', {
                description: 'Whether to pretty-print the bundle when saving it back',
                type: 'boolean',
                default: false
            });
    }

    public static handler(args: Arguments) {
        new BundleCommand(<BundleOptions><any>args).execute();
    }

    constructor(options: BundleOptions) {
        this.options = options;
    }

    private execute() {
        const content = fs.readFileSync(this.options.path).toString();
        const bundle: IBundle = JSON.parse(content);

        if (!bundle || bundle.resourceType !== 'Bundle') {
            throw new Error('Path/content is not a Bundle');
        }

        bundle.type = this.options.type;

        if (this.options.type === 'batch' || this.options.type === 'transaction') {
            (bundle.entry || []).filter(e => e.resource && e.resource.resourceType).forEach(e => {
                e.request = {
                    method: e.resource.id ? 'PUT' : 'POST',
                    url: e.resource.resourceType + (e.resource.id ? '/' + e.resource.id : '')
                };
            });
        } else {
            (bundle.entry || []).forEach(e => delete e.request);
        }

        if (this.options.pretty) {
            fs.writeFileSync(this.options.path, JSON.stringify(bundle, null, '\t'));
        } else {
            fs.writeFileSync(this.options.path, JSON.stringify(bundle));
        }
    }
}