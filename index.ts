import * as yargs from 'yargs';
import * as fs from 'fs';
import {Export} from './export';
import {Import} from './import';
import {FixIds} from './fixids';
import {Transfer} from "./transfer";

class ExportOptions {
    public fhir_base: string;
    public out_file: string;
    public page_size: number;
    public fhir_version: 'dstu3'|'r4';
}

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
                // TODO: No command parameters
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
            .command('export <fhir_base> <out_file> [page_size] [fhir_version]', 'Export data from a FHIR server', (yargs: any) => {
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
                    .option('fhir_version', {
                        alias: 'v',
                        type: 'string',
                        describe: 'The version of FHIR that the server supports',
                        choices: ['dstu3', 'r4'],
                        default: 'dstu3'
                    });
            }, (argv: ExportOptions) => {
                const exporter = new Export(argv.fhir_base, argv.out_file, argv.page_size, argv.fhir_version);
                exporter.execute();
            })
            .help()
            .argv;
    }
}

let main = new Main();