import * as request from 'request';
import {Export} from "./export";
import {IBundle} from "./fhir/bundle";
import * as path from "path";
import * as fs from "fs";
import {getFhirInstance} from "./helper";
import {Arguments, Argv} from "yargs";
import {DeleteOptions} from "./delete";

export interface TransferOptions {
    source?: string;
    input_file?: string;
    destination: string;
    page_size?: number;
    history?: boolean;
    exclude?: string[];
}

interface ResourceInfo {
    resourceType: string;
    id: string;
    reference: any;
}

export class Transfer {
    private readonly _bundleEntryCount = 500;

    private options: TransferOptions;
    private messages: {
        message: string;
        resource: any;
        response: any;
    }[] = [];
    private exportedResources: any[];
    private resources: { [key: string]: { info: ResourceInfo, versions: any[] } };
    private sortedResources: any[];
    private fhirVersion: 'dstu3'|'r4';

    public static command2 = 'import <destination> <input_file>';
    public static description2 = 'Import resources from a Bundle file onto the specified server';
    public static command1 = 'transfer <destination> <source>';
    public static description1 = 'Transfer resources from one server to another';

    public static args2(yargs: Argv): Argv {
        return yargs
            .positional('destination', {
                type: 'string',
                describe: 'The FHIR server base of the destination FHIR server (where resources are stored)'
            })
            .positional('input_file', {
                type: 'string',
                describe: 'Path to a file that represents the export of the source FHIR server'
            });
    }

    public static args1(yargs: Argv): Argv {
        return yargs
            .positional('destination', {
                type: 'string',
                describe: 'The FHIR server base of the destination FHIR server (where resources are stored)'
            })
            .positional('source', {
                type: 'string',
                describe: 'The base URL of the source FHIR server (where resources are retrieved)'
            })
            .option('page_size', {
                alias: 's',
                type: 'number',
                describe: 'The size of results to return per page when requesting resources from the source server',
                default: 50
            })
            .option('history', {
                alias: 'h',
                type: 'boolean',
                describe: 'Whether ot include the history of each resource when requesting resources from the source server'
            })
            .option('exclude', {
                alias: 'e',
                array: true,
                type: 'string',
                description: 'Resource types that should be excluded from the export (ex: AuditEvent) of the source server'
            });
    }

    public static handler(args: Arguments) {
        new Transfer(<TransferOptions><any>args).execute()
            .then(() => process.exit(0));
    }

    constructor(options: TransferOptions) {
        this.options = options;
    }

    private async requestUpdate(fhirBase: string, resource: any, isTransaction = false) {
        let url = fhirBase;

        if (!isTransaction) {
            url += (fhirBase.endsWith('/') ? '' : '/') + resource.resourceType + '/' + resource.id;

            resource.id = resource.id.trim();

            if (resource.resourceType === 'Bundle' && !resource.type) {
                resource.type = 'collection';
            }
        }

        return new Promise((resolve) => {
            request({ url: url, method: isTransaction ? 'POST' : 'PUT', body: resource, json: true }, (err, response, body) => {
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
                    } else if (body.resourceType === 'Bundle') {
                        if (body.entry) {
                            for (let entry of body.entry) {
                                if (entry.response && entry.response.status && !entry.response.status.startsWith('20')) {
                                    console.log('do something');
                                }
                            }
                        }
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
            const foundResourceInfo = this.resources[reference.resourceType + '/' + reference.id];

            if (foundResourceInfo) {
                delete this.resources[foundResourceInfo.info.resourceType + '/' + foundResourceInfo.info.id];
                await this.updateResource(foundResourceInfo.info.resourceType, foundResourceInfo.info.id);
            }
        }
    }

    private async updateResource(resourceType: string, id: string) {
        const versionEntries = this.exportedResources
            .filter(res => res.resourceType === resourceType && res.id === id);

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
                    .filter((c: any) => c.resourceType === 'Binary' && !c.data && c._data)
                    .forEach((c: any) => delete c._data);
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
        if (this.sortedResources.length <= 0) return;

        console.log(`${this.sortedResources.length} resources left to import.`);

        const bundle: IBundle = {
            resourceType: 'Bundle',
            type: 'batch',
            entry: []
        };

        while (bundle.entry.length < this._bundleEntryCount && this.sortedResources.length > 0) {
            const nextResource = this.sortedResources[0];
            this.sortedResources.splice(0, 1);
            bundle.entry.push({
                request: {
                    method: 'PUT',
                    url: `${nextResource.resourceType}/${nextResource.id}`
                },
                resource: nextResource
            });
        }

        await this.requestUpdate(this.options.destination, bundle, true);

        await this.updateNext();
    }

    private discoverResources() {
        this.resources = {};

        for (const resource of this.exportedResources) {
            const info = <ResourceInfo> {
                resourceType: resource.resourceType,
                id: resource.id
            };
            const key = info.resourceType + '/' + info.id;
            if (!this.resources[key]) {
                this.resources[key] = {
                    info: info,
                    versions: [resource]
                };
            } else {
                this.resources[key].versions.push(resource);
            }
        }
    }

    private sortResources() {
        this.sortedResources = [];
        const sortQueue = Object.keys(this.resources);

        const sortResource = (resource: { info: ResourceInfo, versions: any[] }) => {
            if (!resource) return;
            const queueIndex = sortQueue.indexOf(resource.info.resourceType + '/' + resource.info.id);
            if (queueIndex < 0) return;
            sortQueue.splice(queueIndex, 1);

            for (const rv of resource.versions) {
                const resourceReferences = this.getResourceReferences(rv.resource);
                resourceReferences.forEach(rr => {
                    if (sortQueue.indexOf(rr.resourceType + '/' + rr.id) >= 0) {
                        sortResource(this.resources[rr.resourceType + '/' + rr.id]);
                    }
                });
                this.sortedResources.push(rv);
            }
        };

        while (sortQueue.length > 0) {
            const nextSortKey = sortQueue[0];
            const nextSortInfo = this.resources[nextSortKey];

            sortResource(nextSortInfo);
        }
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

    private loadExportedResources(obj: any) {
        if (obj.resourceType === 'Bundle') {
            this.exportedResources = (obj.entry || []).map((e: any) => e.resource);
        } else if (obj instanceof Array) {
            this.exportedResources = obj as any[];
        }

        if (this.options.exclude) {
            this.exportedResources = this.exportedResources.filter(res => {
                return this.options.exclude.indexOf(res.resourceType) < 0;
            });
        }
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
            this.loadExportedResources(exporter.exportBundle);
        } else if (this.options.input_file) {
            const exporter = await Export.newExporter({
                fhir_base: this.options.destination,
                page_size: this.options.page_size
            });

            this.fhirVersion = exporter.version;

            let inputFileObject: any;

            if (this.options.input_file.toLowerCase().endsWith('.xml')) {
                let fhir = getFhirInstance(this.fhirVersion);

                console.log('Parsing input file');
                inputFileObject = fhir.xmlToObj(fs.readFileSync(this.options.input_file).toString()) as IBundle;
            } else if (this.options.input_file.toLowerCase().endsWith('.json')) {
                console.log('Parsing input file');
                inputFileObject = JSON.parse(fs.readFileSync(this.options.input_file).toString());
            } else {
                console.log('Unexpected file type for input_file');
                return;
            }

            this.loadExportedResources(inputFileObject);
        } else if (!this.exportedResources) {
            console.log('Either source or input_file must be specified');
            return;
        }

        console.log('Discovering resources to be imported');

        this.discoverResources();

        console.log('Determining which resources have references that need placeholders');

        // Find ImplementationGuides that are referencing ValueSets not included in the bundle and
        // add a placeholder value set to the Bundle with a URL. This block can be removed after this HAPI issue is fixed:
        // https://github.com/hapifhir/hapi-fhir/issues/2332
        this.exportedResources
            .forEach(ig => {
                const references = this.getResourceReferences(ig);
                const notFoundReferences = references
                    .filter(r => !this.resources[r.resourceType + '/' + r.id]);

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

                        this.exportedResources.push(mockResource);
                        this.resources[ref.resourceType + '/' + ref.id] = { info: ref, versions: [mockResource] };
                    });
            });

        console.log('Sorting resources for import');

        this.sortResources();

        console.log('Turning off subscriptions initially');

        // Find all subscriptions and make sure all the versions of the subscriptions have their status set to "off"
        // Keep track of all the Subscriptions that were on so that they can later be turned *back* on.
        // The subscription's considered "active" only if the most recent version of the subscription is active.
        const subscriptions = Object.keys(this.resources).filter(k => k.startsWith('Subscription/')).map(k => this.resources[k]);
        const activeSubscriptions = subscriptions
            .filter(r => {
                const lastVersion = r.versions[r.versions.length - 1];
                return lastVersion.status === 'active' || lastVersion.status === 'requested';
            });
        subscriptions.forEach(r => {
            // Make sure all versions of the Subscription resources are set to non-active status
            r.versions
                .filter(v => v.status === 'active' || v.status === 'requested')
                .forEach(v => v.status = 'off');
        });

        console.log('Beginning import of resources into destination server');

        // Start processing the resource queue
        await this.updateNext();

        console.log(`Turning on ${activeSubscriptions.length} subscriptions`);

        // Turn the status of active subscriptions back on
        for (let activeSubscription of activeSubscriptions) {
            const lastVersion = activeSubscription.versions[activeSubscription.versions.length - 1];
            lastVersion.status = 'requested';

            console.log(`Updating the status of Subscription/${lastVersion.id} to turn the subscription on`);
            await this.requestUpdate(this.options.destination, lastVersion);
            console.log(`Done updating the status of Subscription/${lastVersion.id}`);
        }

        // For debugging a specific resource's issues
        //await this.updateResource('OrganizationAffiliation', 'PDXOrgAffiliationGroupFacility102');

        if (this.messages && this.messages.length > 0) {

            if (!fs.existsSync(path.join(__dirname, 'issues'))) {
                fs.mkdirSync(path.join(__dirname, 'issues'));
            }

            const issuesPath = path.join(__dirname, 'issues-' +
                new Date().toISOString()
                    .replace(/\./g, '')
                    .replace('T', '_')
                    .replace(/:/g, '-')
                    .substring(0, 19) +
                '.json');

            console.log('Found issues when transferring... Storing issues at path: ' + issuesPath);

            fs.writeFileSync(issuesPath, JSON.stringify(this.messages, null, '\t'));
        }
    }
}
