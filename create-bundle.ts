import * as fs from 'fs';
import * as request from "request";
import * as tar from 'tar';
import {unzipSync} from 'zlib';
import * as streamifier from 'streamifier';
import {Arguments, Argv} from "yargs";
import {Fhir} from "fhir/fhir";

export interface CreateBundleOptions {
    path: string[];
    output: string;
    exclude?: string[];
}

export class CreateBundle {
    private options: CreateBundleOptions;
    private resources: any[] = [];
    private fhir = new Fhir();

    public static command = 'create-bundle <output>';
    public static description = 'Creates a bundle from one or more paths in the form of directories, package.tgz files on the file system, or urls to package.tgz files';

    public static args(args: Argv): Argv {
        return args
            .positional('output', {
                description: 'The full path of the bundle that should be created as either JSON or XML'
            })
            .option('exclude', {
                description: 'Expression to be used to exclude files from the bundle',
                array: true
            })
            .option('path', {
                type: 'string',
                description: 'The path to the JSON Bundle file',
                array: true
            });
    }

    public static handler(args: Arguments) {
        new CreateBundle(<CreateBundleOptions><any>args).execute()
            .then(() => process.exit(0));
    }

    constructor(options: CreateBundleOptions) {
        this.options = options;
    }

    private getResourcesFromDirectory(directory: string) {
        fs.readdirSync(directory)
            .filter(fileName => {
                if (!fileName.toLowerCase().endsWith('.json') && !fileName.toLowerCase().endsWith('.xml')) {
                    return false;
                }

                if (this.options.exclude) {
                    const shouldExclude = !!this.options.exclude.find(exclude => {
                        const regex = new RegExp(exclude);
                        return regex.test(fileName);
                    });

                    if (shouldExclude) {
                        return false;
                    }
                }

                return true;
            })
            .forEach(fileName => {
                const fileContent = fs.readFileSync(directory + '\\' + fileName).toString();
                let resource;

                try {
                    if (fileName.toLowerCase().endsWith('.json')) {
                        resource = JSON.parse(fileContent);
                    } else if (fileName.toLowerCase().endsWith('.xml')) {
                        resource = this.fhir.xmlToObj(fileContent);
                    }
                } catch (ex) {
                    console.error(`Error parsing ${fileName}: ${ex.message || ex}`);
                    return;
                }

                if (resource && resource.resourceType) {
                    this.resources.push(resource);
                }
            });
    }

    private async getResourcesFromZip(buffer: Buffer) {
        return new Promise<void>((resolve, reject) => {
            const parser = new tar.Parse();
            let count = 0;
            const skipList = ['package/other', 'package/example', 'package/openapi', 'package/package.json', 'package/.index.json'];
            streamifier.createReadStream(unzipSync(buffer))
                .on('error', (err: any) => {
                    reject(err);
                })
                .on('end', () => {
                    console.log(`Added ${count} resources from ZIP`);
                    resolve();
                })
                .pipe(parser)
                .on('entry', (entry: any) => {
                    const entryPath = entry.header.path;
                    entry.on('data', (data: any) => {
                        if (!entryPath.toLowerCase().endsWith('.json')) {
                            return;
                        }

                        const shouldSkip = skipList.find(sd => entryPath.toLowerCase().indexOf(sd) === 0);

                        if (shouldSkip) {
                            return;
                        }

                        console.log(`Adding ${entry.header.path} from zip`);
                        const json = data.toString();
                        let resource;

                        try {
                            resource = JSON.parse(json);
                        } catch (ex) {
                            console.error(`Error parsing ${entry.header.path} as JSON: ${ex}`);
                            return;
                        }

                        if (resource.resourceType) {
                            this.resources.push(resource);
                            count++;
                        } else {
                            console.error(`${entry.header.path} is not a FHIR resource`);
                        }
                    });
                });
        });
    }

    private async getFromUrl(url: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            request({ url, encoding: null}, (error, response, body) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(body);
                }
            });
        });
    }

    private async getResourcesFromPath(path: string) {
        if (path.toLowerCase().indexOf('https://') >= 0 || path.toLowerCase().indexOf('http://') >= 0) {
            console.log(`Getting resources from ${path} as a zip/tgz`);
            const results = await this.getFromUrl(path);
            await this.getResourcesFromZip(results);
        } else if (fs.lstatSync(path).isDirectory()) {
            this.getResourcesFromDirectory(path);
        } else if (fs.existsSync(path) && path.toLowerCase().endsWith('.tgz')) {
            await this.getResourcesFromZip(fs.readFileSync(path));
            console.log('Done adding');
        } else {
            throw new Error(`Unexpected path ${path}`);
        }
    }

    private async getResources() {
        for (let next of this.options.path) {
            await this.getResourcesFromPath(next);
        }
    }

    public async execute() {
        await this.getResources();

        const bundle = {
            resourceType: 'Bundle',
            type: 'batch',
            entry: this.resources.map(resource => {
                return {
                    resource,
                    request: {
                        method: 'PUT',
                        url: `${resource.resourceType}/${resource.id}`
                    }
                }
            })
        };

        this.resources.filter(r => {
            const found = this.resources.filter(next => next.id === r.id && next.resourceType === r.resourceType);
            if (found.length > 1) {
                console.error(`Resource ${r.resourceType}/${r.id} occurs ${found.length} times`);
            }
        })

        console.log(`Putting ${bundle.entry.length} resources into a Bundle`);

        if (this.options.output.toLowerCase().endsWith('.json')) {
            fs.writeFileSync(this.options.output, JSON.stringify(bundle));
        } else if (this.options.output.toLowerCase().endsWith('.xml')) {
            const xml = this.fhir.objToXml(bundle);
            fs.writeFileSync(this.options.output, xml);
        } else {
            console.error(`Can't determine which format to convert the bundle to (XML or JSON) based on the output path: ${this.options.output}`);
        }

        console.log(`Saved bundle to ${this.options.output}`);
    }
}