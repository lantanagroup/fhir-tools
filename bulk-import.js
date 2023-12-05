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
exports.BulkImport = void 0;
var fs = require("fs");
var path = require("path");
var transfer_1 = require("./transfer");
var BulkImport = exports.BulkImport = (function () {
    function BulkImport(options) {
        this.options = options;
    }
    BulkImport.args = function (yargs) {
        return yargs
            .positional('destination', {
            type: 'string',
            describe: 'The FHIR server base of the destination FHIR server (where resources are stored)'
        })
            .positional('directory', {
            type: 'string',
            describe: 'Path to a directory where .ndjson files are stored to be imported'
        });
    };
    BulkImport.handler = function (args) {
        new BulkImport(args).execute()
            .then(function () { return process.exit(0); });
    };
    BulkImport.prototype.execute = function () {
        return __awaiter(this, void 0, void 0, function () {
            var files, transfer;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        files = fs.readdirSync(this.options.directory)
                            .filter(function (f) { return f.toLowerCase().endsWith('.ndjson'); });
                        transfer = new transfer_1.Transfer({
                            destination: this.options.destination,
                        });
                        transfer.exportedResources = [];
                        console.log('Reading resources from directory');
                        files.forEach(function (f) {
                            var _a;
                            var fileContent = fs.readFileSync(path.join(_this.options.directory, f)).toString();
                            var fileLines = fileContent.replace(/\r/g, '').split('\n').filter(function (fl) { return !!fl; });
                            var fileResources = fileLines.map(function (fl) { return JSON.parse(fl); });
                            (_a = transfer.exportedResources).push.apply(_a, fileResources);
                        });
                        transfer.exportedResources = transfer.exportedResources.filter(function (e) { return e.resourceType === 'Patient'; });
                        transfer.exportedResources
                            .filter(function (e) { return !e.status; })
                            .forEach(function (e) {
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
                        transfer.exportedResources
                            .filter(function (e) { return e.resourceType === 'Patient' && !e.identifier; })
                            .forEach(function (e) {
                            e.identifier = [{
                                    system: 'https://sanerproject.org',
                                    value: e.id
                                }];
                        });
                        console.log('Done reading resources. Beginning transfer');
                        return [4, transfer.execute()];
                    case 1:
                        _a.sent();
                        console.log('Done transferring.');
                        return [2];
                }
            });
        });
    };
    BulkImport.command = 'bulk-import <destination> <directory>';
    BulkImport.description = 'Import resources from bulk ndjson files in a directory';
    return BulkImport;
}());
//# sourceMappingURL=bulk-import.js.map