"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Delete = void 0;
var export_1 = require("./export");
var base_command_1 = require("./base-command");
var auth_1 = require("./auth");
var Delete = exports.Delete = (function (_super) {
    __extends(Delete, _super);
    function Delete(options) {
        var _this = _super.call(this) || this;
        _this.options = options;
        return _this;
    }
    Delete.args = function (yargs) {
        return yargs
            .positional('fhir_base', {
            type: 'string',
            describe: 'The base url of the FHIR server'
        })
            .option('batch', {
            alias: 'b',
            type: 'boolean',
            default: true,
            description: 'Indicates if deletes can be performed in batch/transaction'
        })
            .option('page_size', {
            alias: 's',
            type: 'number',
            describe: 'The size of results to return per page',
            default: 50
        })
            .option('expunge', {
            alias: 'e',
            boolean: true,
            description: 'Indicates if $expunge should be executed on the FHIR server after deleting resources'
        })
            .option('hard', {
            alias: 'h',
            type: 'boolean',
            description: 'Indicates if "hardDelete=true" parameter should be passed to the DELETE requests'
        })
            .option('auth_config', {
            alias: 'a',
            description: 'Path auth YML config file or the JSON equivalent content to use when authenticating requests to the FHIR server'
        })
            .option('resource_type', {
            alias: 'r',
            array: true,
            description: 'Specify one or more resource types to get backup from the FHIR server. If not specified, will default to all resources supported by the server.',
            type: 'string'
        })
            .option('short_elements', {
            description: 'Indicates if the _elements parameter on the server should use "<resourceType>.<property>" notation, or simply "<property>" notation',
            default: false,
            type: 'boolean'
        })
            .option('summary', {
            description: 'Indicates if the export from the FHIR server to get a list of resources to delete should be requested using summary (just getting the ID of each resource) or not.',
            default: true,
            type: 'boolean'
        });
    };
    Delete.handler = function (args) {
        var deleter = new Delete(args);
        deleter.execute()
            .then(function () { return process.exit(0); });
    };
    Delete.prototype.execute = function () {
        return __awaiter(this, void 0, void 0, function () {
            var exporter, resourceTypes, _loop_1, this_1, _i, resourceTypes_1, resourceType, expungeResults;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.auth = new auth_1.Auth();
                        return [4, this.auth.prepare(this.options.auth_config)];
                    case 1:
                        _a.sent();
                        return [4, export_1.Export.newExporter({
                                fhir_base: this.options.fhir_base,
                                page_size: this.options.page_size,
                                exclude: this.options.exclude,
                                history: false,
                                summary: this.options.summary,
                                auth_config: this.options.auth_config,
                                resource_type: this.options.resource_type
                            })];
                    case 2:
                        exporter = _a.sent();
                        return [4, exporter.execute(false)];
                    case 3:
                        _a.sent();
                        resourceTypes = exporter.exportBundle.entry.reduce(function (prev, curr) {
                            if (prev.indexOf(curr.resource.resourceType) < 0) {
                                prev.push(curr.resource.resourceType);
                            }
                            return prev;
                        }, []);
                        _loop_1 = function (resourceType) {
                            var filteredEntries, bundle, options, deleteResults, ex_1, _b, filteredEntries_1, entry, options, deleteResults;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        filteredEntries = exporter.exportBundle.entry.filter(function (e) { return e.resource.resourceType === resourceType; });
                                        if (!this_1.options.batch) return [3, 5];
                                        bundle = {
                                            resourceType: 'Bundle',
                                            type: 'transaction',
                                            entry: filteredEntries.map(function (e) {
                                                return {
                                                    request: {
                                                        method: 'DELETE',
                                                        url: resourceType + '/' + e.resource.id + (_this.options.hard ? '?hardDelete=true' : '')
                                                    }
                                                };
                                            })
                                        };
                                        _c.label = 1;
                                    case 1:
                                        _c.trys.push([1, 3, , 4]);
                                        options = {
                                            method: 'POST',
                                            url: this_1.options.fhir_base,
                                            json: true,
                                            body: bundle
                                        };
                                        this_1.auth.authenticateRequest(options);
                                        return [4, this_1.doRequest(options)];
                                    case 2:
                                        deleteResults = _c.sent();
                                        this_1.handleResponseError(deleteResults);
                                        console.log("Deleted ".concat(deleteResults.entry.length, " resources for resource type ").concat(resourceType));
                                        return [3, 4];
                                    case 3:
                                        ex_1 = _c.sent();
                                        console.error("Failed to delete resources for ".concat(resourceType, " due to: ").concat(ex_1.message));
                                        return [3, 4];
                                    case 4: return [3, 9];
                                    case 5:
                                        _b = 0, filteredEntries_1 = filteredEntries;
                                        _c.label = 6;
                                    case 6:
                                        if (!(_b < filteredEntries_1.length)) return [3, 9];
                                        entry = filteredEntries_1[_b];
                                        options = {
                                            method: 'DELETE',
                                            url: this_1.joinUrl(this_1.options.fhir_base, resourceType, entry.resource.id) + (this_1.options.hard ? '?hardDelete=true' : ''),
                                            json: true
                                        };
                                        this_1.auth.authenticateRequest(options);
                                        return [4, this_1.doRequest(options)];
                                    case 7:
                                        deleteResults = _c.sent();
                                        this_1.handleResponseError(deleteResults);
                                        console.log("Deleted ".concat(entry.resource.resourceType, "/").concat(entry.resource.id));
                                        _c.label = 8;
                                    case 8:
                                        _b++;
                                        return [3, 6];
                                    case 9: return [2];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, resourceTypes_1 = resourceTypes;
                        _a.label = 4;
                    case 4:
                        if (!(_i < resourceTypes_1.length)) return [3, 7];
                        resourceType = resourceTypes_1[_i];
                        return [5, _loop_1(resourceType)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        _i++;
                        return [3, 4];
                    case 7:
                        if (!this.options.expunge) return [3, 9];
                        console.log('Expunging...');
                        return [4, this.doRequest({
                                method: 'POST',
                                url: this.options.fhir_base + '/$expunge',
                                json: true,
                                body: {
                                    "resourceType": "Parameters",
                                    "parameter": [
                                        {
                                            "name": "limit",
                                            "valueInteger": 10000
                                        }, {
                                            "name": "expungeDeletedResources",
                                            "valueBoolean": true
                                        }, {
                                            "name": "expungePreviousVersions",
                                            "valueBoolean": true
                                        }
                                    ]
                                }
                            })];
                    case 8:
                        expungeResults = _a.sent();
                        console.log("Done expunging. Server responded with ".concat(expungeResults.resourceType));
                        _a.label = 9;
                    case 9:
                        console.log('Done');
                        return [2];
                }
            });
        });
    };
    Delete.command = 'delete <fhir_base>';
    Delete.description = 'Delete all resources from a FHIR server';
    return Delete;
}(base_command_1.BaseCommand));
//# sourceMappingURL=delete.js.map