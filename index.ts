#!/usr/bin/env node

import * as yargs from 'yargs';
import {Export} from './export';
import {FixIds} from './fixids';
import {Transfer} from "./transfer";
import {Compare} from "./compare";
import {Delete} from "./delete";
import {BulkImport} from "./bulk-import";
import {BulkAnalyze} from "./bulk-analyze";
import {GetAllResourceIds} from "./get-all-resource-ids";
import {CreateBundle} from "./create-bundle";
import {JsonToXml} from "./json-to-xml";
import {XmlToJson} from "./xml-to-json";
import {CreateCodeSystem, CreateCodeSystemOptions} from "./create-code-system";
import {Transaction} from "./transaction";
import {BundleCommand} from "./bundle-command";

yargs
    .command(CreateBundle.command, CreateBundle.description, CreateBundle.args, CreateBundle.handler)
    .command(FixIds.command, FixIds.description, FixIds.args, FixIds.handler)
    .command(Delete.command, Delete.description, Delete.args, Delete.handler)
    .command(Transfer.command1, Transfer.description1, Transfer.args1, Transfer.handler)
    .command(Transfer.command2, Transfer.description2, Transfer.args2, Transfer.handler)
    .command(BulkImport.command, BulkImport.description, BulkImport.args, BulkImport.handler)
    .command(BulkAnalyze.command, BulkAnalyze.description, BulkAnalyze.args, BulkAnalyze.handler)
    .command(Compare.command, Compare.description, Compare.args, Compare.handler)
    .command(Export.command, Export.description, Export.args, Export.handler)
    .command(GetAllResourceIds.command, GetAllResourceIds.description, GetAllResourceIds.args, GetAllResourceIds.handler)
    .command(JsonToXml.command, JsonToXml.description, JsonToXml.args, JsonToXml.handler)
    .command(XmlToJson.command, XmlToJson.description, XmlToJson.args, XmlToJson.handler)
    .command(CreateCodeSystem.command, CreateCodeSystem.description, CreateCodeSystem.args, CreateCodeSystem.handler)
    .command(Transaction.command, Transaction.description, Transaction.args, Transaction.handler)
    .command(BundleCommand.command, BundleCommand.description, BundleCommand.args, BundleCommand.handler)
    .help()
    .showHelpOnFail(true)
    .demandCommand()
    .argv;