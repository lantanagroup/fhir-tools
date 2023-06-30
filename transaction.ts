import {Arguments, Argv} from "yargs";
import {Auth} from "./auth";
import {IBundle} from "./spec/bundle";
import * as path from "path";
import * as fs from "fs";
import {Fhir} from "fhir/fhir";
import * as request from "request";
import {CoreOptions} from "request";
import {log} from "./helper";

interface TransactionOptions {
    fhirServer: string;
    authConfig?: string;
    bundle: string[];
    batchCount: number;
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
            log(`Skipping ${path} because it does not have any entries`);
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
                    log(`Skipping ${b} because it is not an XML or JSON file`);
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
                if (err || body.resourceType === 'OperationOutcome') {
                    reject(err || body);
                } else {
                    resolve(body);
                }
            });
        });
    }

    private logBundleResponse(path: string, results: any) {
        const goodEntries = (results.entry || []).filter((e: any) => e.response && e.response.status && e.response.status.startsWith('2'));
        const badEntries = (results.entry || []).filter((e: any) => !e.response || !e.response.status && !e.response.status.startsWith('2'));

        log(`Done executing ${path}. ${goodEntries.length} positive and ${badEntries.length} bad responses`);

        if (badEntries.length > 0) {
            log(`Bad responses:`);
            badEntries.forEach((e: any) => {
                if (!e.response) {
                    log('* No response');
                } else if (!e.response.status) {
                    log('* Response without status');
                } else if (e.response.status) {
                    log(`* Response with status "${e.response.status}"`);
                }
            });
        }
    }

    private logOperationOutcome(results: any) {
        (results.issue || []).forEach((issue: any) => {
            log(`${issue.severity || 'ISSUE'}: ${issue.diagnostics}`);
        });
    }

    public async execute() {
        this.auth = new Auth();
        await this.auth.prepare(this.options.authConfig);
        this.getBundles();

        let activeTransactions: Promise<any>[] = [];

        for (let bundleInfo of this.bundles) {
            if (activeTransactions.length >= (this.options.batchCount || 5)) {
                await Promise.race(activeTransactions);
            }

            log(`Executing batch/transaction for ${bundleInfo.path}`);
            const activeTransaction = this.executeBundle(bundleInfo.bundle)
                .then((results) => {
                    this.logBundleResponse(bundleInfo.path, results);
                    activeTransactions.splice(activeTransactions.indexOf(activeTransaction), 1);
                })
                .catch((ex) => {
                    activeTransactions.splice(activeTransactions.indexOf(activeTransaction), 1);

                    if (ex.resourceType === 'OperationOutcome') {
                        log(`Response is OperationOutcome executing batch/transaction ${bundleInfo.path} due to`, true);
                        this.logOperationOutcome(ex);
                    } else {
                        log(`Error executing batch/transaction ${bundleInfo.path} due to: ${ex.message || ex}`, true);
                    }
                });
            activeTransactions.push(activeTransaction);
        }

        log('Done');
    }
}