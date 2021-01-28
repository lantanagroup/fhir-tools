import * as request from 'request';
import {Export} from "./export";
import {IBundle} from "./fhir/bundle";

export interface TransferOptions {
    fhir1_base: string;
    fhir2_base: string;
    page_size: number;
    history?: boolean;
}

export class Transfer {
    private options: TransferOptions;
    private exportedBundle: IBundle;

    constructor(options: TransferOptions) {
        this.options = options;
    }

    private async updateResource(fhirBase: string, resource: any) {
        const url = fhirBase + (fhirBase.endsWith('/') ? '' : '/') + resource.resourceType + '/' + resource.id;

        return new Promise((resolve, reject) => {
            request({ url: url, method: 'PUT', body: resource, json: true }, (err, response, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        });
    }

    private async updateNext() {
        if (this.exportedBundle.entry.length <= 0) {
            return;
        }

        const nextEntry = this.exportedBundle.entry.pop();
        const nextResource = nextEntry.resource;

        console.log(`Putting ${nextResource.resourceType}/${nextResource.id} onto the destination FHIR server. ${this.exportedBundle.entry.length} left...`);

        await this.updateResource(this.options.fhir2_base, nextResource);
        await this.updateNext();
    }

    public async execute() {
        console.log('Retrieving resources from the source FHIR server');

        const exporter = await Export.newExporter({
            fhir_base: this.options.fhir1_base,
            page_size: this.options.page_size,
            history: this.options.history
        });
        await exporter.execute(false);

        console.log('Done retrieving resources');

        this.exportedBundle = exporter.exportBundle;
        await this.updateNext();
    }
}
