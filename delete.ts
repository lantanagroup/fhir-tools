import {Export} from "./export";
import * as request from 'request';
import {IBundle} from "./fhir/bundle";

export interface DeleteOptions {
    fhir_base: string;
    page_size: number;
    exclude?: string[];
    expunge?: boolean;
}

export class Delete {
    private options: DeleteOptions;

    constructor(options: DeleteOptions) {
        this.options = options;
    }

    private async request(options: any) {
        return new Promise((resolve, reject) => {
            request(options, async (err, response, body) => {
                if (err) {
                    return reject(err);
                }

                resolve(body);
            });
        });
    }

    public async execute() {
        const exporter = await Export.newExporter({
            fhir_base: this.options.fhir_base,
            page_size: this.options.page_size,
            exclude: this.options.exclude,
            history: false,
            summary: true
        });
        await exporter.execute(false);

        const resourceTypes = exporter.exportBundle.entry.reduce((prev, curr) => {
            if (prev.indexOf(curr.resource.resourceType) < 0) {
                prev.push(curr.resource.resourceType);
            }

            return prev;
        }, []);

        for (const resourceType of resourceTypes) {
            const bundle = {
                resourceType: 'Bundle',
                type: 'transaction',
                entry: exporter.exportBundle.entry
                    .filter(e => e.resource.resourceType === resourceType)
                    .map(e => {
                        return {
                            request: {
                                method: 'DELETE',
                                url: resourceType + '/' + e.resource.id
                            }
                        }
                    })
            };

            try {
                const deleteResults: IBundle = <any>await this.request({
                    method: 'POST',
                    url: this.options.fhir_base,
                    json: true,
                    body: bundle
                });
                console.log(`Deleted ${deleteResults.entry.length} resources for resource type ${resourceType}`);
            } catch (ex) {
                console.error(`Failed to delete resources for ${resourceType} due to: ${ex.message}`);
            }
        }

        if (this.options.expunge) {
            console.log('Expunging...');

            const expungeResults: any = await this.request({
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
