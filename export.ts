import * as request from 'request';
import {CoreOptions} from 'request';
import * as urljoin from 'url-join';
import * as fs from 'fs';
import * as semver from 'semver';
import {IBundle} from "./fhir/bundle";
import {getFhirInstance} from "./helper";
import {Auth} from "./auth";
import {stringify} from 'JSONStream';
import {Arguments, Argv} from "yargs";

export class ExportOptions {
    public fhir_base: string;
    public out_file?: string;
    public page_size: number;
    public history?: boolean;
    public resource_type?: string[];
    public ig? = false;
    public exclude?: string[];
    public history_queue? = 10;
    public xml? = false;
    public summary? = false;
    public auth_config?: string;
}

export class Export {
    readonly options: ExportOptions;
    readonly maxHistoryQueue: number = 10
    private resourceTypes: string[] = [];
    private bundles: { [resourceType: string]: IBundle[] } = {};
    private auth: Auth;
    public version: 'dstu3'|'r4';
    public exportBundle: IBundle;

    public static command = 'export <fhir_base> <out_file>';
    public static description = 'Export data from a FHIR server. Options to specify types of resources to export, whether to include history, and more.';

    public static args(yargs: Argv): Argv {
        return yargs
            .positional('fhir_base', {
                type: 'string',
                describe: 'The base url of the fhir server'
            })
            .positional('out_file', {
                type: 'string',
                describe: 'Location on computer to store the export'
            })
            .option('page_size', {
                alias: 's',
                type: 'number',
                describe: 'The size of results to return per page',
                default: 50
            })
            .option('history', {
                alias: 'h',
                boolean: true,
                description: 'Indicates if _history should be included'
            })
            .option('resource_type', {
                alias: 'r',
                array: true,
                description: 'Specify one or more resource types to get backup from the FHIR server. If not specified, will default to all resources supported by the server.',
                type: 'string'
            })
            .option('ig', {
                boolean: true,
                description: 'If specified, indicates that the resources in each ImplementationGuide should be found/retrieved and included in the export.'
            })
            .option('exclude', {
                alias: 'e',
                array: true,
                type: 'string',
                description: 'Resource types that should be excluded from the export (ex: AuditEvent)'
            })
            .option('history_queue', {
                type: 'number',
                default: 10,
                description: 'The number of requests for history that can be made in parallel'
            })
            .option('xml', {
                boolean: true,
                description: 'Outputs as XML instead of the default JSON format'
            })
            .option('auth_config', {
                description: 'Path to the auth YML config file to use when authenticating requests to the FHIR server'
            });
    }

    public static handler(args: Arguments) {
        new Export(<ExportOptions><any>args).execute()
            .then(() => process.exit(0));
    }

    constructor(options: ExportOptions) {
        this.options = options;
    }

    public static async newExporter(options: ExportOptions): Promise<Export> {
        const exporter = new Export(options);

        return new Promise((resolve, reject) => {
            const metadataUrl = options.fhir_base + (options.fhir_base.endsWith('/') ? '' : '/') + 'metadata';
            const metadataOptions = {
                method: 'GET',
                url: metadataUrl,
                json: true
            };

            console.log(`Checking ${metadataUrl} of server to determine version and resources`);

            request(metadataOptions, (err, response, metadata) => {
                if (err || response.statusCode != 200) {
                    reject('Error retrieving metadata from FHIR server');
                } else {
                    if (semver.satisfies(metadata.fhirVersion, '>= 3.2.0 < 4.2.0')) {               // R4
                        exporter.version = 'r4';
                    } else if (semver.satisfies(metadata.fhirVersion, '>= 1.1.0 <= 3.0.2')) {       // STU3
                        exporter.version = 'dstu3';
                    }

                    if (!options.resource_type || options.resource_type.length === 0) {
                        (metadata.rest || []).forEach((rest: any) => {
                            (rest.resource || []).forEach((resource: any) => {
                                if (exporter.resourceTypes.indexOf(resource.type) < 0) {
                                    exporter.resourceTypes.push(resource.type);
                                }
                            });
                        });
                    } else {
                        console.log('Using resource types specified by CLI options.');
                        exporter.resourceTypes = options.resource_type;
                    }

                    if (options.exclude && options.exclude.length > 0) {
                        console.log(`Excluding ${options.exclude.length} resource types`);

                        exporter.resourceTypes = exporter.resourceTypes
                                .filter((resourceType: string) => (options.exclude || []).indexOf(resourceType) < 0);
                    }

                    // Sort the resource types to make it easier to follow in logs
                    exporter.resourceTypes
                        .sort((a, b) => a.localeCompare(b));

                    console.log(`Server is ${exporter.version}, found ${exporter.resourceTypes.length} resource types.`);

                    resolve(exporter);
                }
            });
        });
    }

    private async getIgResources(resources: any[]) {
        const body = {
            resourceType: 'Bundle',
            type: 'batch',
            entry: resources.map(r => {
                return {
                    request: {
                        method: 'GET',
                        url: r.reference
                    }
                }
            })
        };

        return new Promise((resolve, reject) => {
            const options: CoreOptions = { method: 'POST', json: true, body: body };
            this.auth.authenticateRequest(options);

            request(this.options.fhir_base, options, (err, response, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        });
    }

    private async request(url: string) {
        return new Promise((resolve, reject) => {
            const options = {
                json: true,
                headers: {
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json'
                }
            };

            this.auth.authenticateRequest(options);
            request(url, options, async (err, response, body) => {
                if (err) {
                    return reject(err);
                }

                if (response.headers && response.headers['content-type'] && !response.headers['content-type'].startsWith('application/json') && !response.headers['content-type'].startsWith('application/fhir+json')) {
                    console.error('Response from FHIR server is not JSON!');
                    return reject('Response from FHIR server is not JSON!');
                }

                resolve(body);
            });
        });
    }

    private static getProtocol(url: string) {
        return url.substring(0, url.indexOf('://'));
    }

    private async getBundle(nextUrl: string, resourceType: string) {
        if (!this.bundles[resourceType]) {
            this.bundles[resourceType] = [];
        }

        console.log(`Requesting ${nextUrl}`);

        const options = {};
        this.auth.authenticateRequest(options);
        const body: any = await this.request(nextUrl, options);

        if (body.entry && body.entry.length > 0) {
            console.log(`Found ${body.entry.length} ${resourceType} entries in bundle (Bundle.total = ${body.total})`);
            this.bundles[resourceType].push(body);
        } else {
            console.log(`No entries found for ${resourceType}`);
        }

        const nextLink = (body.link || []).find((link: any) => link.relation === 'next');

        if (nextLink && nextLink.url) {
            if (Export.getProtocol(nextUrl) !== Export.getProtocol(nextLink.url)) {
                nextLink.url = Export.getProtocol(nextUrl) + nextLink.url.substring(Export.getProtocol(nextLink.url).length);
            }

            await this.getBundle(nextLink.url, resourceType);
        }
    }

    private async processQueue() {
        if (this.resourceTypes.length === 0) {
            return;
        }

        const resourceType = this.resourceTypes.pop();
        let nextUrl = urljoin(this.options.fhir_base, resourceType);
        nextUrl += '?_count=' + this.options.page_size.toString();

        if (this.options.summary) {
            nextUrl += `&_elements=${resourceType}.id`;
        }

        console.log(`----------------------------\r\nStarting retrieve for ${resourceType}`);

        await this.getBundle(nextUrl, resourceType);
        await this.processQueue();

        if (this.bundles[resourceType] && this.bundles[resourceType].length > 0 && this.bundles[resourceType][0].hasOwnProperty('total')) {
            let totalEntries = this.bundles[resourceType]
                .reduce((previous, current) => {
                    for (let entry of current.entry || []) {
                        previous.push(entry);
                    }
                    return previous;
                }, [])
                .length;

            if (totalEntries !== this.bundles[resourceType][0].total) {
                console.error(`Expected ${this.bundles[resourceType][0].total} but actually have ${totalEntries} for ${resourceType}`);
            }
        }
    }

    public async execute(shouldOutput = true) {
        this.auth = new Auth();
        await this.auth.prepare(this.options.auth_config);

        await this.processQueue();

        this.exportBundle = {
            resourceType: 'Bundle',
            type: 'transaction',
            total: 0,
            entry: []
        };

        for (let resourceType of Object.keys(this.bundles)) {
            const bundles = this.bundles[resourceType];

            for (let bundle of bundles) {
                for (let entry of (bundle.entry || [])) {
                    // Add the resource to the transaction bundle
                    this.exportBundle.entry.push({
                        resource: entry.resource,
                        request: {
                            method: 'PUT',
                            url: `${resourceType}/${entry.resource.id}`
                        }
                    });
                    this.exportBundle.total++;
                }
            }
        }

        // Ensure that all resources referenced by IGs are included in the export if they're on the server
        if (this.options.ig) {
            const igs = this.exportBundle.entry
                .filter(tbe => tbe.resource.resourceType === 'ImplementationGuide')
                .map(tbe => tbe.resource);

            for (let ig of igs) {
                let igResourcesBundle: any;

                console.log(`Searching for missing resources for the IG ${ig.id}`);

                if (this.version === 'r4' && ig.definition && ig.definition.resource) {
                    const igResourceReferences = ig.definition.resource
                        .filter((r: any) => r.reference && r.reference.reference)
                        .map((r: any) => r.reference);
                    igResourcesBundle = await this.getIgResources(igResourceReferences);
                } else if (this.version === 'dstu3') {
                    let igResourceReferences: any[] = [];
                    (ig.package || []).forEach((p: any) => {
                        const nextResourceReferences = (p.resource || [])
                            .filter((r: any) => r.sourceReference && r.sourceReference.reference)
                            .map((r: any) => r.sourceReference);
                        igResourceReferences = igResourceReferences.concat(nextResourceReferences);
                    });
                    igResourcesBundle = await this.getIgResources(igResourceReferences);
                }

                if (igResourcesBundle && igResourcesBundle.entry) {
                    const foundIgResources = igResourcesBundle.entry
                        .filter((e: any) => e.response && e.response.status === '200 OK')
                        .map((e: any) => e.resource);
                    const missingIgResources = foundIgResources
                        .filter((r: any) => {
                            return !this.exportBundle.entry.find(tbe => {
                                return tbe.resource && tbe.resource.resourceType === r.resourceType && tbe.resource.id === r.id;
                            });
                        })
                        .map((e: any) => {
                            return {
                                request: {
                                    method: 'PUT',
                                    resource: e.resource
                                }
                            };
                        });

                    if (missingIgResources.length > 0) {
                        this.exportBundle.entry = this.exportBundle.entry.concat(missingIgResources);
                        console.log(`Adding ${missingIgResources.length} resources not already in export for IG ${ig.id}`);
                    }
                }
            }
        }

        if (this.options.history) {
            console.log('Getting history for resources');

            await this.getNextHistory(this.exportBundle, this.exportBundle.entry.map(e => e));

            console.log('Done exporting history for resources');
        }

        if (shouldOutput) {
            if (this.options.xml) {
                let fhir = getFhirInstance(this.version);
                const outputContent = fhir.objToXml(this.exportBundle);
                fs.writeFileSync(this.options.out_file, outputContent);
            } else {
                if (fs.existsSync(this.options.out_file)) {
                    fs.unlinkSync(this.options.out_file);
                }

                const st = stringify();
                st.pipe(fs.createWriteStream(this.options.out_file, { encoding: 'utf8' }));
                this.exportBundle.entry.forEach((entry) => st.write(entry.resource as any));
                st.end();
            }

            console.log('done!');
        }
    }

    private async getNextHistory(exportBundle: any, entries: any[]) {
        if (entries.length === 0) {
            return;
        }

        const nextEntries = entries.slice(0, this.maxHistoryQueue);
        entries.splice(0, nextEntries.length);
        const promises = nextEntries.map(e => this.getHistory(exportBundle, e));
        await Promise.all(promises);

        console.log(`Getting next ${this.maxHistoryQueue} resource's history. ${entries.length} left.`);
        await this.getNextHistory(exportBundle, entries);
    }

    private async getHistory(exportBundle: any, exportEntry: any) {
        const options = {
            method: 'GET',
            url: this.options.fhir_base + (this.options.fhir_base.endsWith('/') ? '' : '/') + exportEntry.request.url + '/_history',
            json: true
        };

        return new Promise<void>((resolve) => {
            this.auth.authenticateRequest(options);
            request(options, (err, response, historyBundle) => {
                if (err || !historyBundle || historyBundle.resourceType !== 'Bundle') {
                    resolve();
                    return;
                }

                let replacementHistory = (historyBundle.entry || [])
                    .filter((entry: any) => entry.resource)
                    .map((entry: any) => {
                        return {
                            request: {
                                method: 'PUT',
                                url: `${entry.resource.resourceType}/${entry.resource.id}`
                            },
                            resource: entry.resource
                        };
                    });

                const integerVersions = replacementHistory.filter((y: any) => y.resource.meta.versionId.match(/^\d+$/g)).length === replacementHistory.length;

                // If all versions are integer, sort using integer algorithm, otherwise sort using localeCompare on string
                if (integerVersions) {
                    replacementHistory = replacementHistory
                        .sort((a: any, b: any) => {
                            const aVersion = parseInt(a.resource.meta.versionId);
                            const bVersion = parseInt(b.resource.meta.versionId);
                            return aVersion < bVersion ? -1 : (aVersion > bVersion ? 1 : 0);
                        });
                } else {
                    replacementHistory = replacementHistory
                        .sort((a: any, b: any) => {
                            const aVersion = a.resource.meta.versionId;
                            const bVersion = b.resource.meta.versionId;
                            return aVersion.localeCompare(bVersion);
                        });
                }

                if (replacementHistory.length > 1) {
                    const exportEntryIndex = exportBundle.entry.indexOf(exportEntry);
                    exportBundle.entry.splice(exportEntryIndex, 1, ...replacementHistory);

                    console.log(`Added ${replacementHistory.length - 1} history items for ${exportEntry.resource.resourceType}/${exportEntry.resource.id}`);
                }

                resolve();
            });
        });
    }
}
