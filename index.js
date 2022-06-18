"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.Main = void 0;
var yargs = require("yargs");
var export_1 = require("./export");
var fixids_1 = require("./fixids");
var transfer_1 = require("./transfer");
var compare_1 = require("./compare");
var delete_1 = require("./delete");
var bulk_import_1 = require("./bulk-import");
var bulk_analyze_1 = require("./bulk-analyze");
var FixIdsOptions = (function () {
    function FixIdsOptions() {
    }
    return FixIdsOptions;
}());
var Main = (function () {
    function Main() {
        var _this = this;
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
            .command('delete <fhir_base>', 'Delete resources from a FHIR server', function (yargs) {
            yargs
                .positional('fhir_base', {
                type: 'string',
                describe: 'The base url of the FHIR server'
            })
                .option('page_size', {
                alias: 's',
                type: 'number',
                describe: 'The size of results to return per page',
                "default": 50
            })
                .option('expunge', {
                alias: 'e',
                boolean: true,
                description: 'Indicates if $expunge should be executed on the FHIR server after deleting resources'
            });
        }, function (argv) {
            var deleter = new delete_1.Delete(argv);
            deleter.execute();
        })
            .command('import <destination> <input_file>', 'Import resources from a Bundle file onto the specified server', function (yargs) {
            yargs
                .positional('destination', {
                type: 'string',
                describe: 'The FHIR server base of the destination FHIR server (where resources are stored)'
            })
                .positional('input_file', {
                type: 'string',
                describe: 'Path to a file that represents the export of the source FHIR server'
            });
        }, function (argv) {
            var transfer = new transfer_1.Transfer(argv);
            transfer.execute();
        })
            .command('bulk-import <destination> <directory>', 'Import resources from bulk ndjson files in a directory', function (yargs) {
            yargs
                .positional('destination', {
                type: 'string',
                describe: 'The FHIR server base of the destination FHIR server (where resources are stored)'
            })
                .positional('directory', {
                type: 'string',
                describe: 'Path to a directory where .ndjson files are stored to be imported'
            });
        }, function (argv) {
            var bulkImport = new bulk_import_1.BulkImport(argv);
            bulkImport.execute();
        })
            .command('bulk-analyze <inputDir> <outputDir>', 'Analyze resources from bulk ndjson files in a directory', function (yargs) {
            yargs
                .positional('inputDir', {
                type: 'string',
                describe: 'Path to a directory where .ndjson files are stored'
            })
                .positional('outputDir', {
                type: 'string',
                describe: 'Path to where the output analysis TSV files shoudl be stored'
            });
        }, function (argv) {
            var bulkAnalyze = new bulk_analyze_1.BulkAnalyze(argv);
            bulkAnalyze.execute();
        })
            .command('transfer <destination> <source>', 'Transfer resources from one server to another', function (yargs) {
            yargs
                .positional('destination', {
                type: 'string',
                describe: 'The FHIR server base of the destination FHIR server (where resources are stored)'
            })
                .positional('source', {
                type: 'string',
                describe: 'The base URL of the source FHIR server (where resources are retrieved)'
            })
                .option('page_size', {
                alias: 's',
                type: 'number',
                describe: 'The size of results to return per page when requesting resources from the source server',
                "default": 50
            })
                .option('history', {
                alias: 'h',
                type: 'boolean',
                describe: 'Whether ot include the history of each resource when requesting resources from the source server'
            })
                .option('exclude', {
                alias: 'e',
                array: true,
                type: 'string',
                description: 'Resource types that should be excluded from the export (ex: AuditEvent) of the source server'
            });
        }, function (argv) {
            var transfer = new transfer_1.Transfer(argv);
            transfer.execute();
        })
            .command('compare <fhir1_base> <fhir2_base>', 'Compare the resources from one FHIR server to another', function (yargs) {
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
                "default": 50
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
        }, function (argv) {
            var compare = new compare_1.Compare(argv);
            compare.execute();
        })
            .command('export <fhir_base> <out_file>', 'Export data from a FHIR server', function (yargs) {
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
                "default": 10,
                description: 'The number of requests for history that can be made in parallel'
            })
                .option('xml', {
                boolean: true,
                description: 'Outputs as XML instead of the default JSON format'
            })
                .option('auth_config', {
                description: 'Path to the auth YML config file to use when authenticating requests to the FHIR server'
            });
        }, function (argv) { return __awaiter(_this, void 0, void 0, function () {
            var exporter;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, export_1.Export.newExporter(argv)];
                    case 1:
                        exporter = _a.sent();
                        return [4, exporter.execute()];
                    case 2:
                        _a.sent();
                        return [2];
                }
            });
        }); })
            .help()
            .argv;
    }
    return Main;
}());
exports.Main = Main;
var main = new Main();
//# sourceMappingURL=index.js.map