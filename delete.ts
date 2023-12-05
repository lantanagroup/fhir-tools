import {Export} from "./export";
import * as request from 'request';
import {IBundle} from "./spec/bundle";
import {Arguments, Argv} from "yargs";
import * as path from "path";
import {BaseCommand} from "./base-command";
import {del} from "request";
import {Auth} from "./auth";

export interface DeleteOptions {
    fhir_base: string;
    batch: boolean;
    page_size: number;
    exclude?: string[];
    expunge?: boolean;
    hard?: boolean;
    auth_config?: string;
    resource_type?: string[];
    summary?: boolean;
    short_elements?: boolean;
}

export class Delete extends BaseCommand {
    private options: DeleteOptions;
    private auth: Auth;

    public static command = 'delete <fhir_base>';
    public static description = 'Delete all resources from a FHIR server';

    public static args(yargs: Argv): Argv {
        return yargs
            .positional('fhir_base', {
                type: 'string',
                describe: 'The base url of the FHIR server'
            })
            .option('batch', {
                alias: 'b',
                type: 'boolean',
                default: true,
                description: 'Indicates if deletes can be performed in batch/transaction'
            })
            .option('page_size', {
                alias: 's',
                type: 'number',
                describe: 'The size of results to return per page',
                default: 50
            })
            .option('expunge', {
                alias: 'e',
                boolean: true,
                description: 'Indicates if $expunge should be executed on the FHIR server after deleting resources'
            })
            .option('hard', {
                alias: 'h',
                type: 'boolean',
                description: 'Indicates if "hardDelete=true" parameter should be passed to the DELETE requests'
            })
            .option('auth_config', {
                alias: 'a',
                description: 'Path auth YML config file or the JSON equivalent content to use when authenticating requests to the FHIR server'
            })
            .option('resource_type', {
                alias: 'r',
                array: true,
                description: 'Specify one or more resource types to get backup from the FHIR server. If not specified, will default to all resources supported by the server.',
                type: 'string'
            })
            .option('short_elements', {
                description: 'Indicates if the _elements parameter on the server should use "<resourceType>.<property>" notation, or simply "<property>" notation',
                default: false,
                type: 'boolean'
            })
            .option('summary', {
                description: 'Indicates if the export from the FHIR server to get a list of resources to delete should be requested using summary (just getting the ID of each resource) or not.',
                default: true,
                type: 'boolean'
            });
    }

    public static handler(args: Arguments) {
        const deleter = new Delete(<DeleteOptions><any>args);
        deleter.execute()
            .then(() => process.exit(0));
    }

    constructor(options: DeleteOptions) {
        super();
        this.options = options;
    }

    public async execute() {
        this.auth = new Auth();
        await this.auth.prepare(this.options.auth_config);

        const exporter = await Export.newExporter({
            fhir_base: this.options.fhir_base,
            page_size: this.options.page_size,
            exclude: this.options.exclude,
            history: false,
            summary: this.options.summary,
            auth_config: this.options.auth_config,
            resource_type: this.options.resource_type
        });
        await exporter.execute(false);

        const resourceTypes = exporter.exportBundle.entry.reduce((prev, curr) => {
            if (prev.indexOf(curr.resource.resourceType) < 0) {
                prev.push(curr.resource.resourceType);
            }

            return prev;
        }, []);

        for (const resourceType of resourceTypes) {
            const filteredEntries = exporter.exportBundle.entry.filter(e => e.resource.resourceType === resourceType);
            if (this.options.batch) {
                const bundle = {
                    resourceType: 'Bundle',
                    type: 'transaction',
                    entry: filteredEntries.map(e => {
                        return {
                            request: {
                                method: 'DELETE',
                                url: resourceType + '/' + e.resource.id + (this.options.hard ? '?hardDelete=true' : '')
                            }
                        }
                    })
                };

                try {
                    const options = {
                        method: 'POST',
                        url: this.options.fhir_base,
                        json: true,
                        body: bundle
                    };

                    this.auth.authenticateRequest(options);
                    const deleteResults: IBundle = <any>await this.doRequest(options);

                    this.handleResponseError(deleteResults);

                    console.log(`Deleted ${deleteResults.entry.length} resources for resource type ${resourceType}`);
                } catch (ex) {
                    console.error(`Failed to delete resources for ${resourceType} due to: ${ex.message}`);
                }
            } else {
                for (let entry of filteredEntries) {
                    const options = {
                        method: 'DELETE',
                        url: this.joinUrl(this.options.fhir_base, resourceType, entry.resource.id) + (this.options.hard ? '?hardDelete=true' : ''),
                        json: true
                    };

                    this.auth.authenticateRequest(options);

                    const deleteResults = await this.doRequest(options);

                    this.handleResponseError(deleteResults);
                    console.log(`Deleted ${entry.resource.resourceType}/${entry.resource.id}`);
                }
            }
        }

        if (this.options.expunge) {
            console.log('Expunging...');

            const expungeResults: any = await this.doRequest({
                method: 'POST',
                url: this.options.fhir_base + '/$expunge',
                json: true,
                body: {
                    "resourceType": "Parameters",
                    "parameter": [
                        {
                            "name": "limit",
                            "valueInteger": 10000
                        },{
                            "name": "expungeDeletedResources",
                            "valueBoolean": true
                        },{
                            "name": "expungePreviousVersions",
                            "valueBoolean": true
                        }
                    ]
                }
            });

            console.log(`Done expunging. Server responded with ${expungeResults.resourceType}`);
        }

        console.log('Done');
    }
}
