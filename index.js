#!/usr/bin/env node
"use strict";
exports.__esModule = true;
var yargs = require("yargs");
var export_1 = require("./export");
var fixids_1 = require("./fixids");
var transfer_1 = require("./transfer");
var compare_1 = require("./compare");
var delete_1 = require("./delete");
var bulk_import_1 = require("./bulk-import");
var bulk_analyze_1 = require("./bulk-analyze");
var get_all_resource_ids_1 = require("./get-all-resource-ids");
var create_bundle_1 = require("./create-bundle");
yargs
    .command(create_bundle_1.CreateBundle.command, create_bundle_1.CreateBundle.description, create_bundle_1.CreateBundle.args, create_bundle_1.CreateBundle.handler)
    .command(fixids_1.FixIds.command, fixids_1.FixIds.description, fixids_1.FixIds.args, fixids_1.FixIds.handler)
    .command(delete_1.Delete.command, delete_1.Delete.description, delete_1.Delete.args, delete_1.Delete.handler)
    .command(transfer_1.Transfer.command1, transfer_1.Transfer.description1, transfer_1.Transfer.args1, transfer_1.Transfer.handler)
    .command(transfer_1.Transfer.command2, transfer_1.Transfer.description2, transfer_1.Transfer.args2, transfer_1.Transfer.handler)
    .command(bulk_import_1.BulkImport.command, bulk_import_1.BulkImport.description, bulk_import_1.BulkImport.args, bulk_import_1.BulkImport.handler)
    .command(bulk_analyze_1.BulkAnalyze.command, bulk_analyze_1.BulkAnalyze.description, bulk_analyze_1.BulkAnalyze.args, bulk_analyze_1.BulkAnalyze.handler)
    .command(compare_1.Compare.command, compare_1.Compare.description, compare_1.Compare.args, compare_1.Compare.handler)
    .command(export_1.Export.command, export_1.Export.description, export_1.Export.args, export_1.Export.handler)
    .command(get_all_resource_ids_1.GetAllResourceIds.command, get_all_resource_ids_1.GetAllResourceIds.description, get_all_resource_ids_1.GetAllResourceIds.args, get_all_resource_ids_1.GetAllResourceIds.handler)
    .help()
    .showHelpOnFail(true)
    .demandCommand()
    .argv;
//# sourceMappingURL=index.js.map