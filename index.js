"use strict";
exports.__esModule = true;
var yargs = require("yargs");
var fs = require("fs");
var export_1 = require("./export");
var import_1 = require("./import");
var fixids_1 = require("./fixids");
var transfer_1 = require("./transfer");
var ExportOptions = (function () {
    function ExportOptions() {
    }
    return ExportOptions;
}());
var ImportOptions = (function () {
    function ImportOptions() {
    }
    return ImportOptions;
}());
var FixIdsOptions = (function () {
    function FixIdsOptions() {
    }
    return FixIdsOptions;
}());
var Main = (function () {
    function Main() {
        this.argv = yargs
            .command('fixids <file_path>', 'Fix the ids of resources in a bundle so they can be imported with HAPI', function (yargs) {
            yargs
                .positional('file_path', {
                type: 'string',
                describe: 'The path to the JSON Bundle file'
            });
        }, function (argv) {
            var fixids = new fixids_1.FixIds(argv.file_path);
            fixids.fix();
            fixids.save();
        })
            .command('transfer', 'Transfer resources from one server to another', function (yargs) {
        }, function (argv) {
            var transfer = new transfer_1.Transfer();
            transfer.execute();
        })
            .command('import <fhir_base> <in_file>', 'Import data to a FHIR server', function (yargs) {
            yargs
                .positional('fhir_base', {
                type: 'string',
                describe: 'The base url of the fhir server'
            })
                .positional('in_file', {
                type: 'string',
                describe: 'Location on computer of the bundle to import'
            });
        }, function (argv) {
            var importContent = fs.readFileSync(argv.in_file).toString();
            var bundle = JSON.parse(importContent);
            var importer = new import_1.Import(argv.fhir_base);
            importer.execute(bundle);
        })
            .command('export <fhir_base> <out_file> [page_size] [fhir_version]', 'Export data from a FHIR server', function (yargs) {
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
                "default": 50
            })
                .option('fhir_version', {
                alias: 'v',
                type: 'string',
                describe: 'The version of FHIR that the server supports',
                choices: ['dstu3', 'r4'],
                "default": 'dstu3'
            });
        }, function (argv) {
            var exporter = new export_1.Export(argv.fhir_base, argv.out_file, argv.page_size, argv.fhir_version);
            exporter.execute();
        })
            .help()
            .argv;
    }
    return Main;
}());
exports.Main = Main;
var main = new Main();
//# sourceMappingURL=index.js.map