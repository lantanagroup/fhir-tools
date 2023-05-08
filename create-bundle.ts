import * as fs from 'fs';
import * as request from "request";
import * as tar from 'tar';
import {unzipSync} from 'zlib';
import * as streamifier from 'streamifier';
import {Arguments, Argv} from "yargs";

export interface CreateBundleOptions {
    path: string[];
    output: string;
}

export class CreateBundle {
    private options: CreateBundleOptions;
    private resources: any[] = [];

    public static command = 'create-bundle <output>';
    public static description = 'Creates a bundle from one or more paths in the form of directories, package.tgz files on the file system, or urls to package.tgz files';

    public static args(args: Argv): Argv {
        return args
            .positional('file_path', {
                type: 'string',
                describe: 'The path to the JSON Bundle file'
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
        const files = fs.readdirSync(directory);

        const resources = files.map(fileName => {
            const fileContent = fs.readFileSync(directory + '\\' + fileName).toString();
            return JSON.parse(fileContent);
        });

        this.resources.push(...resources);
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

        fs.writeFileSync(this.options.output, JSON.stringify(bundle));
        console.log(`Saved bundle to ${this.options.output}`);
    }
}