import * as request from 'request';
import {Export} from "./export";
import {IBundle} from "./fhir/bundle";
import * as path from "path";
import * as fs from "fs";
import {getFhirInstance} from "./helper";
import * as util from 'util';

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
    reference: any;
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
    private sleep = util.promisify(setTimeout);

    constructor(options: TransferOptions) {
        this.options = options;
    }

    private async requestUpdate(fhirBase: string, resource: any) {
        const url = fhirBase + (fhirBase.endsWith('/') ? '' : '/') + resource.resourceType + '/' + resource.id;

        resource.id = resource.id.trim();

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

                    resolve(err);
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

                        resolve(message);
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
        const references = this.getResourceReferences(resource);

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

    private async updateResource(resourceType: string, id: string) {
        const versionEntries = this.exportedBundle.entry
            .filter(e => e.resource.resourceType === resourceType && e.resource.id === id);

        console.log(`Putting resource ${resourceType}/${id} on destination server (${versionEntries.length} versions)`);

        for (let versionEntry of versionEntries) {
            const resourceReferences = this.getResourceReferences(versionEntry.resource);

            // Fix references that are formatted incorrectly
            for (let resourceReference of resourceReferences) {
                if (resourceReference.resourceType.trim() !== resourceReference.resourceType || resourceReference.id.trim() !== resourceReference.id) {
                    resourceReference.reference.reference = resourceReference.resourceType.trim() + '/' + resourceReference.id.trim();
                }
            }

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

            // Delete version property from historical ValueSet entries due to HAPI error:
            // Can not create multiple ValueSet resources with ValueSet.url XX and ValueSet.version "1", already have one with resource ID: YY
            if (versionEntry.resource.resourceType === 'ValueSet' && versionEntry !== versionEntries[versionEntries.length - 1]) {
                delete versionEntry.resource.version;
            }

            // Make sure the status of MedicationAdministration is valid
            if (versionEntry.resource.resourceType === 'MedicationAdministration') {
                const validStatuses = ['in-progress', 'not-done', 'on-hold', 'completed', 'entered-in-error', 'stopped', 'unknown'];

                if (validStatuses.indexOf(versionEntry.resource.status) < 0) {
                    versionEntry.resource.status = 'unknown';
                }
            }

            console.log(`Putting resource ${resourceType}/${id}#${versionEntry.resource.meta?.versionId || '1'}...`);

            await this.requestUpdate(this.options.destination, versionEntry.resource);
            //await this.sleep(300);

            console.log(`Done putting resource ${resourceType}/${id}#${versionEntry.resource.meta?.versionId || '1'}`);
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

    private getResourceReferences(obj: any): ResourceInfo[] {
        let references: ResourceInfo[] = [];

        if (!obj) return references;

        if (obj instanceof Array) {
            for (let i = 0; i < obj.length; i++) {
                references = references.concat(this.getResourceReferences(obj[i]));
            }
        } else if (typeof obj === 'object') {
            if (obj.reference && typeof obj.reference === 'string' && obj.reference.split('/').length === 2) {
                const split = obj.reference.split('/');
                references.push({
                    resourceType: split[0],
                    id: split[1],
                    reference: obj
                });
            } else {
                const keys = Object.keys(obj);
                for (let key of keys) {
                    references = references.concat(this.getResourceReferences(obj[key]));
                }
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
            .map(e => e.resource)
            .forEach(ig => {
                const references = this.getResourceReferences(ig);
                const notFoundReferences = references
                    .filter(r => !this.resources.find(n => n.resourceType === r.resourceType && n.id.toLowerCase() === r.id.toLowerCase()));

                notFoundReferences
                    .filter(r => ['Bundle', 'ValueSet', 'ConceptMap', 'SearchParameter'].indexOf(r.resourceType) >= 0)
                    .forEach(ref => {
                        const mockResource: any = {
                            resourceType: ref.resourceType,
                            id: ref.id
                        };

                        if (ref.resourceType === 'ValueSet' || ref.resourceType === 'ConceptMap') {
                            mockResource.url = ig.url + `/${ref.resourceType}/${ref.id}`;
                        } else if (ref.resourceType === 'Bundle') {
                            mockResource.type = 'collection';
                        } else if (ref.resourceType === 'SearchParameter') {
                            mockResource.status = 'unknown';
                        }

                        this.exportedBundle.entry.push({
                            resource: mockResource
                        });
                        this.resources.push(ref);
                    });
            });

        // Find all subscriptions and make sure all the versions of the subscriptions have their status set to "off"
        // Keep track of all the Subscriptions that were on so that they can later be turned *back* on.
        // The subscription's considered "active" only if the most recent version of the subscription is active.
        const subscriptions = this.resources.filter(r => r.resourceType === 'Subscription');
        const activeSubscriptions = subscriptions
            .filter(r => {
                const resourceVersions = this.exportedBundle.entry
                    .filter(e => e.resource.resourceType === r.resourceType && e.resource.id.toLowerCase() === r.id.toLowerCase());
                const activeVersions = resourceVersions.filter(rv => rv.resource.status === 'active' || rv.resource.status === 'requested');

                if (activeVersions.length > 0) {
                    return activeVersions.indexOf(resourceVersions[resourceVersions.length - 1]) >= 0;
                }
            });
        subscriptions.forEach(r => {
            // Make sure all versions of the Subscription resources are set to non-active status
            this.exportedBundle.entry
                .filter(e => e.resource.resourceType === r.resourceType && e.resource.id.toLowerCase() === r.id.toLowerCase())
                .filter(rv => rv.resource.status === 'active' || rv.resource.status === 'requested')
                .forEach(rv => rv.resource.status = 'off');
        })

        // Start processing the resource queue
        await this.updateNext();

        // Turn the status of active subscriptions back on
        for (let activeSubscription of activeSubscriptions) {
            const resourceVersions = this.exportedBundle.entry
                .filter(e => e.resource.resourceType === activeSubscription.resourceType && e.resource.id.toLowerCase() === activeSubscription.id.toLowerCase());
            const lastVersion = resourceVersions[resourceVersions.length - 1];
            lastVersion.resource.status = 'requested';

            console.log(`Updating the status of Subscription/${lastVersion.resource.id} to turn the subscription on`);
            await this.requestUpdate(this.options.destination, lastVersion.resource);
            console.log(`Done updating the status of Subscription/${lastVersion.resource.id}`);
        }

        // For debugging a specific resource's issues
        //await this.updateResource('OrganizationAffiliation', 'PDXOrgAffiliationGroupFacility102');

        if (this.messages && this.messages.length > 0) {
            console.log('Found the following issues when transferring:');

            if (!fs.existsSync(path.join(__dirname, 'issues'))) {
                fs.mkdirSync(path.join(__dirname, 'issues'));
            }

            const issuesPath = path.join(__dirname, 'issues-' +
                new Date().toISOString()
                    .replace(/\./g, '')
                    .replace('T', '_')
                    .replace(/[:]/g, '-')
                    .substring(0, 19) +
                '.json');
            fs.writeFileSync(issuesPath, JSON.stringify(this.messages, null, '\t'));
        }
    }
}
