import * as request from 'request';
import * as fs from 'fs';
import {IBundle} from "./spec/bundle";
import {IList} from "./spec/list";
import {Arguments, Argv} from "yargs";
import {CompareOptions} from "./compare";

export class GetAllResourceIdsOptions {
    fhir_base: string;
    resource_type: string;
    out: string;
    'as-list-resource' = false;
}

export class GetAllResourceIds {
    private readonly options: GetAllResourceIdsOptions;

    public static command = 'get-all-resource-ids <fhir_base> <resource_type>';
    public static description = 'Gets all resource ids for the specified resource types';

    public static args(yargs: Argv): Argv {
        return yargs
            .positional('fhir_base', {
                type: 'string',
                describe: 'The base url of the spec server'
            })
            .positional('resource_type', {
                type: 'string',
                describe: 'The resource type to get all resource ids for'
            })
            .option('out', {
                alias: 'a',
                describe: 'File path to output the ids to'
            })
            .option('as-list-resource', {
                alias: 'l',
                type: 'boolean',
                default: false
            });
    }

    public static handler(args: Arguments) {
        new GetAllResourceIds(<GetAllResourceIdsOptions><any>args).execute()
            .then(() => process.exit(0));
    }

    constructor(options: GetAllResourceIdsOptions) {
        this.options = options;
    }

    private async submitRequest(url: string): Promise<IBundle> {
        return new Promise((resolve, reject) => {
            request({ url: url, json: true }, (error, response, body) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(body);
                }
            });
        });
    }

    private async getNext(url: string, bundle?: IBundle) {
        const response: IBundle = await this.submitRequest(url);
        response.entry = response.entry || [];

        if (response && bundle) {
            bundle.entry = bundle.entry.concat(response.entry);
            bundle.total = bundle.entry.length;
        } else if (!bundle) {
            bundle = response;
        }

        if (response.link) {
            const nextLink = response.link.find(l => l.relation === 'next');

            if (nextLink) {
                console.log(`Get next page of results from ${nextLink.url}`);
                await this.getNext(nextLink.url, bundle);
            }
        }

        return bundle;
    }

    public async execute() {
        const startingUrl = this.options.fhir_base + (this.options.fhir_base.endsWith('/') ? '' : '/') + this.options.resource_type + '?_elements=id&_count=100';
        const bundle = await this.getNext(startingUrl);

        if (bundle && bundle.entry) {
            const ids = bundle.entry.map(e => e.resource.id);
            let content: string;

            if (this.options["as-list-resource"]) {
                const listResource: IList = {
                    resourceType: 'List',
                    status: 'current',
                    mode: 'working',
                    entry: ids.map(i => {
                        return {
                            item: {
                                reference: `${this.options.resource_type}/${i}`
                            }
                        };
                    })
                };
                content = JSON.stringify(listResource, null, '\t');
            } else {
                content = ids.join('\n');
            }

            if (this.options.out) {
                fs.writeFileSync(this.options.out, content);
                console.log(`Wrote IDs to ${this.options.out}`);
            } else {
                console.log(content);
            }
        } else {
            console.log('No bundle or entries returned');
        }
    }
}
