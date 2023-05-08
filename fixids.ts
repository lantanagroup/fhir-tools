import * as fs from 'fs';
import * as _ from 'underscore';
import {Arguments, Argv} from "yargs";

class IdModel {
    public resourceType: string;
    public oldId: string;
    public newId: string;
}

export class FixIds {
    private filePath: string;
    private content: any;
    private ids: IdModel[];

    public static command = 'fixids <file_path>';
    public static description = 'Fix the ids of resources in a bundle so they can be imported with HAPI';

    public static args(args: Argv): Argv {
        return args
            .positional('output', {
                description: ''
            })
            .option('path', {
                array: true,
                demandOption: true
            });
    }

    public static handler(args: Arguments) {
        const fixids = new FixIds(args.file_path);
        fixids.fix();
        fixids.save();
    }

    constructor(bundle: any) {
        if (typeof bundle === 'string') {
            this.filePath = bundle;

            const fileContent = fs.readFileSync(this.filePath).toString();
            this.content = JSON.parse(fileContent);
        } else if (typeof bundle === 'object') {
            this.content = bundle;
        }
    }

    public updateReferences(obj: any) {
        if (obj instanceof Array) {
            for (let i = 0; i < obj.length; i++) {
                if (obj[i] instanceof Array || typeof obj[i] === 'object') {
                    this.updateReferences(obj[i]);
                } else if (typeof obj[i] === 'string') {
                    _.each(this.ids, (id) => {
                        if (obj[i].endsWith(id.resourceType + '/' + id.oldId)) {
                            obj[i] = id.resourceType + '/' + id.newId;
                        }
                    });
                }
            }
        } else if (typeof obj === 'object') {
            const matchingId = _.find(this.ids, (id) => id.resourceType === obj.resourceType && id.oldId === obj.id);

            if (matchingId) {
                obj.id = matchingId.newId;
            }

            for (let i of Object.keys(obj)) {
                if (obj[i] instanceof Array || typeof obj[i] === 'object') {
                    this.updateReferences(obj[i]);
                } else if (typeof obj[i] === 'string') {
                    _.each(this.ids, (id) => {
                        if (obj[i].endsWith(id.resourceType + '/' + id.oldId)) {
                            obj[i] = id.resourceType + '/' + id.newId;
                        }
                    });
                }
            }
        }
    }

    public fix() {
        (this.content.entry || [])
            .filter((entry: any, index: number) => {
                entry.resource && entry.resource.id && entry.resource.id.match(/^\d+$/);
            })
            .map((entry: any) => {
                return <IdModel> {
                    resourceType: entry.resource.resourceType,
                    oldId: entry.resource.id,
                    newId: 't' + entry.resource.id
                };
            });

        this.updateReferences(this.content);
    }

    public save() {
        if (!this.filePath) {
            throw new Error('No file path specified to save to');
        }

        const fileContent = JSON.stringify(this.content, null);
        fs.writeFileSync(this.filePath, fileContent);
    }
}