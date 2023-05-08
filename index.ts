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
    .help()
    .argv;