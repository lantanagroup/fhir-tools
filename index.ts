import * as yargs from 'yargs';
import * as fs from 'fs';
import {Export, ExportOptions} from './export';
import {Import} from './import';
import {FixIds} from './fixids';
import {Transfer} from "./transfer";

class ImportOptions {
    public fhir_base: string;
    public in_file: string;
}

class FixIdsOptions {
    public file_path: string;
}

export class Main {
    private argv: ExportOptions;

    constructor() {
        this.argv = yargs
            .command('fixids <file_path>', 'Fix the ids of resources in a bundle so they can be imported with HAPI', (yargs: any) => {
                yargs
                    .positional('file_path', {
                        type: 'string',
                        describe: 'The path to the JSON Bundle file'
                    });
            }, (argv: FixIdsOptions) => {
                const fixids = new FixIds(argv.file_path);
                fixids.fix();
                fixids.save();
            })
            .command('transfer', 'Transfer resources from one server to another', (yargs: any) => {
                return yargs;
            }, (argv: any) => {
                const transfer = new Transfer();
                transfer.execute();
            })
            .command('import <fhir_base> <in_file>', 'Import data to a FHIR server', (yargs: any) => {
                yargs
                    .positional('fhir_base', {
                        type: 'string',
                        describe: 'The base url of the fhir server'
                    })
                    .positional('in_file', {
                        type: 'string',
                        describe: 'Location on computer of the bundle to import'
                    });
            }, (argv: ImportOptions) => {
                const importContent = fs.readFileSync(argv.in_file).toString();
                const bundle = JSON.parse(importContent);
                const importer = new Import(argv.fhir_base);
                importer.execute(bundle);
            })
            .command('export <fhir_base> <out_file>', 'Export data from a FHIR server', (yargs: any) => {
                yargs
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
                    });
            }, async (argv: ExportOptions) => {
                const exporter = await Export.newExporter(argv);
                await exporter.execute();
            })
            .help()
            .argv;
    }
}

let main = new Main();