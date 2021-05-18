import * as fs from 'fs';
import * as path from 'path';
import {Transfer} from "./transfer";

export interface BulkImportOptions {
    directory: string;
    destination: string;
}

export class BulkImport {
    private options: BulkImportOptions;

    constructor(options: BulkImportOptions) {
        this.options = options;
    }

    public async execute() {
        const files = fs.readdirSync(this.options.directory)
            .filter(f => f.toLowerCase().endsWith('.ndjson'));
        const transfer = new Transfer({
            destination: this.options.destination
        });
        transfer.exportedBundle = {
            resourceType: 'Bundle',
            type: 'batch',
            entry: []
        };

        console.log('Reading resources from directory');

        files.forEach(f => {
            const fileContent = fs.readFileSync(path.join(this.options.directory, f)).toString();
            const fileLines = fileContent.replace(/\r/g, '').split('\n').filter(fl => !!fl);
            const fileResources = fileLines.map(fl => JSON.parse(fl));
            const fileEntries = fileResources.map(fr => {
                return {
                    resource: fr
                };
            });
            transfer.exportedBundle.entry.push(...fileEntries);
        });

        console.log('Done reading resources. Beginning transfer');

        await transfer.execute();
    }
}
