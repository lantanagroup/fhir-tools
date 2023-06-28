import {Arguments, Argv} from "yargs";
import {Auth} from "./auth";
import {IBundle} from "./spec/bundle";
import * as path from "path";
import * as fs from "fs";
import {Fhir} from "fhir/fhir";
import * as request from "request";
import {CoreOptions} from "request";

interface TransactionOptions {
    fhirServer: string;
    authConfig?: string;
    bundle: string[];
}

export class Transaction {
    private options: TransactionOptions;
    private auth: Auth;
    private fhir = new Fhir();
    private bundles: { path: string, bundle: IBundle }[] = [];

    public static command = 'transaction <fhirServer>';
    public static description = 'Execute a bundle as a transaction on the destination fhirServer';

    public static args(yargs: Argv): Argv {
        return yargs
            .positional('fhirServer', {
                type: 'string',
                describe: 'The base url of the fhir server'
            })
            .option('authConfig', {
                description: 'Path to the auth YML config file to use when authenticating requests to the FHIR server'
            })
            .option('bundle', {
                array: true,
                type: 'string',
                demandOption: true,
                description: 'Either a file or directory of JSON/XML files that are bundles to be executed as transactions on the FHIR server'
            });
    }

    public static handler(args: Arguments) {
        new Transaction(<TransactionOptions><any>args).execute()
            .then(() => process.exit(0));
    }

    constructor(options: TransactionOptions) {
        this.options = options;
    }

    private addBundle(path: string) {
        const bundleContent = fs.readFileSync(path).toString();
        let bundle: IBundle;

        if (path.toLowerCase().endsWith('.xml')) {
            bundle = this.fhir.xmlToObj(bundleContent) as IBundle;
        } else if (path.toLowerCase().endsWith('.json')) {
            bundle = JSON.parse(bundleContent);
        } else {
            throw new Error(`Skipping ${path} because it is an unexpected extension`);
        }

        if (!bundle.type || (bundle.type !== 'batch' && bundle.type !== 'transaction')) {
            bundle.type = 'batch';
        }

        if (!bundle.entry || bundle.entry.length === 0) {
            console.log(`Skipping ${path} because it does not have any entries`);
            return;
        }

        bundle.entry = bundle.entry.filter(entry => entry.request || entry.resource);
        bundle.entry.forEach(entry => {
            if (!entry.request || !entry.request.method || !entry.request.url) {
                entry.request = {
                    method: entry.resource.id ? 'PUT' : 'POST',
                    url: entry.resource.id ? `${entry.resource.resourceType}/${entry.resource.id}` : entry.resource.resourceType
                };
            }
        });

        this.bundles.push({
            path,
            bundle
        });
    }

    private getBundles() {
        this.options.bundle.forEach(b => {
            if (fs.lstatSync(b).isDirectory()) {
                fs.readdirSync(b)
                    .filter(f => f.toLowerCase().endsWith('.xml') || f.toLowerCase().endsWith('.json'))
                    .forEach(f => this.addBundle(path.join(b, f)));
            } else {
                if (!b.toLowerCase().endsWith('.xml') && !b.toLowerCase().endsWith('.json')) {
                    console.log(`Skipping ${b} because it is not an XML or JSON file`);
                    return;
                }

                this.addBundle(b);
            }
        });
    }

    private async executeBundle(bundle: IBundle) {
        const options: CoreOptions = {
            method: 'POST',
            body: bundle,
            json: true
        };

        this.auth.authenticateRequest(options);

        return new Promise((resolve, reject) => {
            request(this.options.fhirServer, options, (err, res, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        });
    }


    public async execute() {
        this.auth = new Auth();
        await this.auth.prepare(this.options.authConfig);
        this.getBundles();

        for (let bundleInfo of this.bundles) {
            console.log(`Executing batch/transaction for ${bundleInfo.path}`);
            try {
                const results: any = await this.executeBundle(bundleInfo.bundle);
                console.log(`Done executing, results are:`);
                const goodEntries = (results.entry || []).filter(e => e.response && e.response.status && e.response.status.startsWith('2'));
                const badEntries = (results.entry || []).filter(e => !e.response || !e.response.status && !e.response.status.startsWith('2'));

                console.log(`* ${goodEntries.length} entries with positive response`);
                console.log(`* ${badEntries.length} entries with bad response`);

                console.log(`Bad responses:`);
                badEntries.forEach(e => {
                    if (!e.response) {
                        console.log('* No response');
                    } else if (!e.response.status) {
                        console.log('* Response without status');
                    } else if (e.response.status) {
                        console.log(`* Response with status "${e.response.status}"`);
                    }
                });
            } catch (ex) {
                console.error(`Error executing batch/transaction ${bundleInfo.path} due to: ${ex.message || ex}`);
            }
        }
    }
}