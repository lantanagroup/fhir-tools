import * as fs from 'fs';
import * as _ from 'underscore';

export class FixR4 {
    private filePath: string;
    private content: any;

    constructor(bundle: any) {
        if (typeof bundle === 'string') {
            this.filePath = bundle;

            const fileContent = fs.readFileSync(this.filePath).toString();
            this.content = JSON.parse(fileContent);
        } else if (typeof bundle === 'object') {
            this.content = bundle;
        }
    }

    public fixBinary(binary: any) {
        if (binary.content) {
            binary.data = binary.content;
            delete binary.content;
        }
    }

    public fixResource(resource: any) {
        if (!resource) return;

        if (resource.resourceType === 'Binary') {
            this.fixBinary(resource);
        }

        _.each(resource.contained, (contained) => {
            this.fixResource(contained);
        });
    }

    public fix() {
        _.each(this.content.entry, (entry: any) => this.fixResource(entry.resource));
    }

    public save() {
        if (!this.filePath) {
            throw new Error('No file path specified to save to');
        }

        const fileContent = JSON.stringify(this.content, null);
        fs.writeFileSync(this.filePath, fileContent);
    }
}