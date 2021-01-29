import * as request from 'request';
import {Export} from "./export";
import {IBundle} from "./fhir/bundle";
import * as path from "path";
import * as fs from "fs";
import {ParseConformance} from "fhir/parseConformance";
import {getFhirInstance} from "./helper";

export interface TransferOptions {
    source?: string;
    input_file?: string;
    destination: string;
    page_size: number;
    history?: boolean;
    exclude?: string[];
}

interface ResourceInfo {
    resourceType: string;
    id: string;
}

export class Transfer {
    private options: TransferOptions;
    private exportedBundle: IBundle;
    private messages: {
        message: string;
        resource: any;
        response: any;
    }[] = [];
    private resources: ResourceInfo[];
    private fhirVersion: 'dstu3'|'r4';

    constructor(options: TransferOptions) {
        this.options = options;
    }

    private async requestUpdate(fhirBase: string, resource: any) {
        const url = fhirBase + (fhirBase.endsWith('/') ? '' : '/') + resource.resourceType + '/' + resource.id;

        if (resource.resourceType === 'Bundle' && !resource.type) {
            resource.type = 'collection';
        }

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
                            resource,
                            response: body
                        });
                    } else {
                        this.messages.push({
                            message: `An error was returned from the server: ${err}`,
                            resource,
                            response: body
                        });
                    }

                    reject(err);
                } else {
                    if (!body.resourceType) {
                        this.messages.push({
                            message: 'Response for putting resource on destination server did not result in a resource: ' + JSON.stringify(body),
                            resource,
                            response: body
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
                            resource,
                            response: body
                        });

                        reject(message);
                    } else if (body.resourceType !== resource.resourceType) {
                        this.messages.push({
                            message: 'Unexpected resource returned from server when putting resource on destination: ' + JSON.stringify(body),
                            resource,
                            response: body
                        });
                        resolve(body);
                    } else {
                        resolve(body);
                    }
                }
            });
        });
    }

    private async updateReferences(resource: any) {
        if (resource.resourceType === 'ImplementationGuide') {
            const references = this.getIgReferences(resource);

            if (references.length > 0) {
                console.log(`Found ${references.length} references to store on the destination server first`);
            }

            for (let reference of references) {
                const foundResourceInfo = this.resources.find(r => r.resourceType === reference.resourceType && r.id === reference.id);

                if (foundResourceInfo) {
                    const foundResourceInfoIndex = this.resources.indexOf(foundResourceInfo);
                    this.resources.splice(foundResourceInfoIndex, 1);
                    await this.updateResource(foundResourceInfo.resourceType, foundResourceInfo.id);
                }
            }
        }
    }

    private async updateResource(resourceType: string, id: string) {
        const versionEntries = this.exportedBundle.entry
            .filter(e => e.resource.resourceType === resourceType && e.resource.id === id);

        console.log(`Putting resource ${resourceType}/${id} on destination server (${versionEntries.length} versions)`);

        for (let versionEntry of versionEntries) {
            await this.updateReferences(versionEntry.resource);

            // Remove extensions from Binary.data that do not have a value for Binary.data
            // https://github.com/hapifhir/hapi-fhir/issues/2333
            if (versionEntry.resource.contained) {
                versionEntry.resource.contained
                    .filter(c => c.resourceType === 'Binary' && !c.data && c._data)
                    .forEach(c => delete c._data);
            }

            // Make sure bundles have a type
            if (versionEntry.resource.resourceType === 'Bundle' && !versionEntry.resource.type) {
                versionEntry.resource.type = 'collection';
            }

            console.log(`Putting resource ${resourceType}/${id}#${versionEntry.resource.meta?.versionId || '1'}...`);
            await this.requestUpdate(this.options.destination, versionEntry.resource);
        }
    }

    private async updateNext() {
        if (this.resources.length <= 0) {
            return;
        }

        console.log(`Getting next resource to update (${this.resources.length})`);

        const next = this.resources[0];
        this.resources.splice(0, 1);

        await this.updateResource(next.resourceType, next.id);
        await this.updateNext();
    }

    private discoverResources() {
        this.resources = [];
        this.exportedBundle.entry
            .map(e => {
                return {
                    resourceType: e.resource.resourceType,
                    id: e.resource.id
                };
            })
            .forEach(e => {
                if (!this.resources.find(u => u.resourceType === e.resourceType && u.id === e.id)) {
                    this.resources.push(e);
                }
            });
    }

    private getIgReferences(ig: any): ResourceInfo[] {
        const references: ResourceInfo[] = [];

        if (this.fhirVersion === 'dstu3') {
            if (ig.package) {
                ig.package.forEach(p => {
                    if (p.resource) {
                        p.resource.forEach(r => {
                            if (r.sourceReference && r.sourceReference.reference && r.sourceReference.reference.indexOf('/') > 0) {
                                const split = r.sourceReference.reference.split('/');

                                if (!references.find(n => n.resourceType === split[0] && n.id.toLowerCase() === split[1].toLowerCase())) {
                                    references.push({
                                        resourceType: split[0],
                                        id: split[1]
                                    });
                                }
                            }
                        });
                    }
                });
            }
        } else if (this.fhirVersion === 'r4') {
            if (ig.definition && ig.definition.resource) {
                ig.definition.resource
                    .filter(r => r.reference && r.reference.reference && r.reference.reference.split('/').length > 0)
                    .forEach(r => {
                        const split = r.reference.reference.split('/');

                        if (!references.find(n => n.resourceType === split[0] && n.id.toLowerCase() === split[1].toLowerCase())) {
                            references.push({
                                resourceType: split[0],
                                id: split[1]
                            });
                        }
                    });
            }
        }

        return references;
    }

    public async execute() {
        if (this.options.source) {
            console.log('Retrieving resources from the source FHIR server');

            const exporter = await Export.newExporter({
                fhir_base: this.options.source,
                page_size: this.options.page_size,
                history: this.options.history,
                exclude: this.options.exclude
            });
            await exporter.execute(false);

            console.log('Done retrieving resources');

            this.fhirVersion = exporter.version;
            this.exportedBundle = exporter.exportBundle;
        } else if (this.options.input_file) {
            const exporter = await Export.newExporter({
                fhir_base: this.options.destination,
                page_size: this.options.page_size
            });

            this.fhirVersion = exporter.version;

            if (this.options.input_file.toLowerCase().endsWith('.xml')) {
                let fhir = getFhirInstance(this.fhirVersion);

                console.log('Parsing input file');
                this.exportedBundle = fhir.xmlToObj(fs.readFileSync(this.options.input_file).toString()) as IBundle;
            } else if (this.options.input_file.toLowerCase().endsWith('.json')) {
                console.log('Parsing input file');
                this.exportedBundle = JSON.parse(fs.readFileSync(this.options.input_file).toString());
            } else {
                console.log('Unexpected file type for input_file');
                return;
            }

            if (this.options.exclude) {
                this.exportedBundle.entry = this.exportedBundle.entry.filter(e => {
                    return this.options.exclude.indexOf(e.resource.resourceType) < 0;
                });
            }
        } else {
            console.log('Either source or input_file must be specified');
            return;
        }

        this.discoverResources();

        // Find ImplementationGuides that are referencing ValueSets not included in the bundle and
        // add a placeholder value set to the Bundle with a URL. This block can be removed after this HAPI issue is fixed:
        // https://github.com/hapifhir/hapi-fhir/issues/2332
        this.exportedBundle.entry
            .filter(e => e.resource.resourceType === 'ImplementationGuide')
            .map(e => e.resource)
            .forEach(ig => {
                const references = this.getIgReferences(ig);
                const notFoundReferences = references
                    .filter(r => !this.resources.find(n => n.resourceType === r.resourceType && n.id.toLowerCase() === r.id.toLowerCase()));

                notFoundReferences
                    .filter(r => ['Bundle', 'ValueSet', 'ConceptMap'].indexOf(r.resourceType) >= 0)
                    .forEach(ref => {
                        const mockResource: any = {
                            resourceType: ref.resourceType,
                            id: ref.id
                        };

                        if (ref.resourceType === 'ValueSet' || ref.resourceType === 'ConceptMap') {
                            mockResource.url = ig.url + `/${ref.resourceType}/${ref.id}`;
                        } else if (ref.resourceType === 'Bundle') {
                            mockResource.type = 'collection';
                        }

                        this.exportedBundle.entry.push({
                            resource: mockResource
                        });
                        this.resources.push(ref);
                    });
            });

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
