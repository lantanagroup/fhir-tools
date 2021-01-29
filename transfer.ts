import * as request from 'request';
import {Export} from "./export";
import {IBundle} from "./fhir/bundle";
import * as path from "path";
import * as fs from "fs";

export interface TransferOptions {
    fhir1_base: string;
    fhir2_base: string;
    page_size: number;
    history?: boolean;
    exclude?: string[];
}

export class Transfer {
    private options: TransferOptions;
    private exportedBundle: IBundle;
    private messages: {
        message: string;
        resource: any;
    }[] = [];

    constructor(options: TransferOptions) {
        this.options = options;
    }

    private async updateResource(fhirBase: string, resource: any) {
        const url = fhirBase + (fhirBase.endsWith('/') ? '' : '/') + resource.resourceType + '/' + resource.id;

        return new Promise((resolve, reject) => {
            request({ url: url, method: 'PUT', body: resource, json: true }, (err, response, body) => {
                if (err) {
                    if (body && body.resourceType === 'OperationOutcome' && !body.id) {
                        let message = JSON.stringify(body);

                        if (body.issue && body.issue.length > 0 && body.issue[0].diagnostics) {
                            message = body.issue[0].diagnostics;
                        } else if (body.text && body.text.div) {
                            message = body.text.div;
                        }

                        this.messages.push({
                            message,
                            resource
                        });
                    } else {
                        this.messages.push({
                            message: `An error was returned from the server: ${err}`,
                            resource
                        });
                    }

                    reject(err);
                } else {
                    if (!body.resourceType) {
                        this.messages.push({
                            message: 'Response for putting resource on destination server did not result in a resource: ' + JSON.stringify(body),
                            resource
                        });
                        resolve(body);
                    } else if (body.resourceType === 'OperationOutcome' && !body.id) {
                        let message = JSON.stringify(body);

                        if (body.issue && body.issue.length > 0 && body.issue[0].diagnostics) {
                            message = body.issue[0].diagnostics;
                        } else if (body.text && body.text.div) {
                            message = body.text.div;
                        }

                        this.messages.push({
                            message,
                            resource
                        });

                        reject(message);
                    } else if (body.resourceType !== resource.resourceType) {
                        this.messages.push({
                            message: 'Unexpected resource returned from server when putting resource on destination: ' + JSON.stringify(body),
                            resource
                        });
                        resolve(body);
                    } else {
                        resolve(body);
                    }
                }
            });
        });
    }

    private async updateNext() {
        if (this.exportedBundle.entry.length <= 0) {
            return;
        }

        const nextEntry = this.exportedBundle.entry[0];
        this.exportedBundle.entry.splice(0, 1);
        const nextResource = nextEntry.resource;

        console.log(`Putting ${nextResource.resourceType}/${nextResource.id} onto the destination FHIR server. ${this.exportedBundle.entry.length} left...`);

        try {
            await this.updateResource(this.options.fhir2_base, nextResource);
        } catch (ex) {
            console.log('Error putting resource on destination server: ' + ex.message);
        }

        await this.updateNext();
    }

    public async execute() {
        console.log('Retrieving resources from the source FHIR server');

        const exporter = await Export.newExporter({
            fhir_base: this.options.fhir1_base,
            page_size: this.options.page_size,
            history: this.options.history,
            exclude: this.options.exclude
        });
        await exporter.execute(false);

        console.log('Done retrieving resources');

        this.exportedBundle = exporter.exportBundle;
        await this.updateNext();

        if (this.messages && this.messages.length > 0) {
            console.log('Found the following issues when transferring:');

            if (!fs.existsSync(path.join(__dirname, 'issues'))) {
                fs.mkdirSync(path.join(__dirname, 'issues'));
            }

            this.messages.forEach(m => {
                const identifier = this.options.history ?
                    `${m.resource.resourceType}-${m.resource.id}-${m.resource.meta.versionId}` :
                    `${m.resource.resourceType}-${m.resource.id}`;
                console.log(`${identifier}: ${m.message}`);
                const fileName = `${identifier}.json`;
                fs.writeFileSync(path.join(__dirname, 'issues', fileName), JSON.stringify(m.resource, null, '\t'));
            });
        }
    }
}
