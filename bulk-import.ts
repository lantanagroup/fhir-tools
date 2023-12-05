import * as fs from 'fs';
import * as path from 'path';
import {Transfer, TransferOptions} from "./transfer";
import {Arguments, Argv} from "yargs";

export interface BulkImportOptions {
    directory: string;
    destination: string;
}

export class BulkImport {
    private options: BulkImportOptions;

    public static command = 'bulk-import <destination> <directory>';
    public static description = 'Import resources from bulk ndjson files in a directory';

    public static args(yargs: Argv): Argv {
        return yargs
            .positional('destination', {
                type: 'string',
                describe: 'The FHIR server base of the destination FHIR server (where resources are stored)'
            })
            .positional('directory', {
                type: 'string',
                describe: 'Path to a directory where .ndjson files are stored to be imported'
            });
    }

    public static handler(args: Arguments) {
        new BulkImport(<BulkImportOptions><any>args).execute()
            .then(() => process.exit(0));
    }

    constructor(options: BulkImportOptions) {
        this.options = options;
    }

    public async execute() {
        const files = fs.readdirSync(this.options.directory)
            .filter(f => f.toLowerCase().endsWith('.ndjson'));
        const transfer = new Transfer({
            destination: this.options.destination,
        });
        transfer.exportedResources = [];

        console.log('Reading resources from directory');

        files.forEach(f => {
            const fileContent = fs.readFileSync(path.join(this.options.directory, f)).toString();
            const fileLines = fileContent.replace(/\r/g, '').split('\n').filter(fl => !!fl);
            const fileResources = fileLines.map(fl => JSON.parse(fl));
            transfer.exportedResources.push(...fileResources);
        });

        /*
        transfer.exportedBundle.entry = transfer.exportedBundle.entry
            .filter(e => e.resource && e.resource.resourceType === 'MedicationStatement')
            .map(e => {
                const medStmt = e.resource;
                const entry = {
                    resource: {
                        resourceType: 'MedicationRequest',
                        id: medStmt.id,
                        intent: 'order',
                        identifier: medStmt.identifier,
                        status: medStmt.status || 'completed',
                        statusReason: medStmt.statusReason && medStmt.statusReason.length > 0 ? medStmt.statusReason[0] : null,
                        category: medStmt.category ? [medStmt.category] : null,
                        medicationCodeableConcept: medStmt.medicationCodeableConcept,
                        medicationReference: medStmt.medicationReference,
                        subject: medStmt.subject,
                        encounter: medStmt.context,
                        authoredOn: medStmt.effectiveDateTime,
                        reasonCode: medStmt.reasonCode,
                        reasonReference: medStmt.reasonReference,
                        note: medStmt.note,
                        dosage: medStmt.dosage
                    }
                };

                if (medStmt.effectivePeriod) {
                    entry.resource.dispenseRequest = {
                        validityPeriod: medStmt.effectivePeriod
                    };
                }

                return entry;
            });
         */

        transfer.exportedResources = transfer.exportedResources.filter((e: { resourceType: string; }) => e.resourceType === 'Patient');

        /* Ensure a status is appropriately set for resources */
        transfer.exportedResources
            .filter((e: { status: any; }) => !e.status)
            .forEach((e: { resourceType: any; status: string; }) => {
                switch (e.resourceType) {
                    case 'Encounter':
                        e.status = 'finished';
                        break;
                    case 'Observation':
                        e.status = 'final';
                        break;
                    case 'MedicationRequest':
                        e.status = 'completed';
                        break;
                }
            });

        /* Ensure that all Patient resources have an identifier */
        transfer.exportedResources
            .filter((e: { resourceType: string; identifier: any; }) => e.resourceType === 'Patient' && !e.identifier)
            .forEach((e: { identifier: { system: string; value: any; }[]; id: any; }) => {
                e.identifier = [{
                    system: 'https://sanerproject.org',
                    value: e.id
                }];
            });

        console.log('Done reading resources. Beginning transfer');

        await transfer.execute();

        console.log('Done transferring.');
    }
}
