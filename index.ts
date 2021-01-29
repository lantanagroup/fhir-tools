import * as yargs from 'yargs';
import * as fs from 'fs';
import {Export, ExportOptions} from './export';
import {FixIds} from './fixids';
import {Transfer} from "./transfer";
import {Compare} from "./compare";

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
            .command('transfer <destination>', 'Transfer resources from one server to another', (yargs: any) => {
                yargs
                    .positional('destination', {
                        type: 'string',
                        describe: 'The FHIR server base of the destination FHIR server (where resources are stored)'
                    })
                    .option('source', {
                        alias: 'f',
                        type: 'string',
                        describe: 'The base URL of the source FHIR server (where resources are retrieved)'
                    })
                    .option('input_file', {
                        alias: 'i',
                        type: 'string',
                        describe: 'Path to a file that represents the export of the source FHIR server'
                    })
                    .option('page_size', {
                        alias: 's',
                        type: 'number',
                        describe: 'The size of results to return per page',
                        default: 50
                    })
                    .option('history', {
                        alias: 'h',
                        type: 'boolean',
                        describe: 'Whether ot include the history of each resource'
                    })
                    .option('exclude', {
                        alias: 'e',
                        array: true,
                        type: 'string',
                        description: 'Resource types that should be excluded from the export (ex: AuditEvent)'
                    });
            }, (argv: any) => {
                const transfer = new Transfer(argv);
                transfer.execute();
            })
            .command('compare <fhir1_base> <fhir2_base>', 'Compare the resources from one FHIR server to another', (yargs: any) => {
                yargs
                    .positional('fhir1_base', {
                        type: 'string',
                        describe: 'The FHIR server base of the first FHIR server'
                    })
                    .positional('fhir2_base', {
                        type: 'string',
                        describe: 'The FHIR server base of the second FHIR server'
                    })
                    .option('page_size', {
                        alias: 's',
                        type: 'number',
                        describe: 'The size of results to return per page',
                        default: 50
                    })
                    .option('exclude', {
                        alias: 'e',
                        array: true,
                        type: 'string',
                        description: 'Resource types that should be excluded from the export (ex: AuditEvent)'
                    })
                    .option('history', {
                        alias: 'h',
                        boolean: true,
                        description: 'Indicates if _history should be included'
                    });
            }, (argv: any) => {
                const compare = new Compare(argv);
                compare.execute();
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
