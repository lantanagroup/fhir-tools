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
exports.Transaction = void 0;
var auth_1 = require("./auth");
var path = require("path");
var fs = require("fs");
var fhir_1 = require("fhir/fhir");
var request = require("request");
var helper_1 = require("./helper");
var Transaction = exports.Transaction = (function () {
    function Transaction(options) {
        this.fhir = new fhir_1.Fhir();
        this.bundles = [];
        this.options = options;
    }
    Transaction.args = function (yargs) {
        return yargs
            .positional('fhirServer', {
            type: 'string',
            describe: 'The base url of the fhir server'
        })
            .option('authConfig', {
            description: 'Path to the auth YML config file to use when authenticating requests to the FHIR server'
        })
            .option('bundle', {
            array: true,
            type: 'string',
            demandOption: true,
            description: 'Either a file or directory of JSON/XML files that are bundles to be executed as transactions on the FHIR server'
        });
    };
    Transaction.handler = function (args) {
        new Transaction(args).execute()
            .then(function () { return process.exit(0); });
    };
    Transaction.prototype.addBundle = function (path) {
        var bundleContent = fs.readFileSync(path).toString();
        var bundle;
        if (path.toLowerCase().endsWith('.xml')) {
            bundle = this.fhir.xmlToObj(bundleContent);
        }
        else if (path.toLowerCase().endsWith('.json')) {
            bundle = JSON.parse(bundleContent);
        }
        else {
            throw new Error("Skipping ".concat(path, " because it is an unexpected extension"));
        }
        if (!bundle.type || (bundle.type !== 'batch' && bundle.type !== 'transaction')) {
            bundle.type = 'batch';
        }
        if (!bundle.entry || bundle.entry.length === 0) {
            (0, helper_1.log)("Skipping ".concat(path, " because it does not have any entries"));
            return;
        }
        bundle.entry = bundle.entry.filter(function (entry) { return entry.request || entry.resource; });
        bundle.entry.forEach(function (entry) {
            if (!entry.request || !entry.request.method || !entry.request.url) {
                entry.request = {
                    method: entry.resource.id ? 'PUT' : 'POST',
                    url: entry.resource.id ? "".concat(entry.resource.resourceType, "/").concat(entry.resource.id) : entry.resource.resourceType
                };
            }
        });
        this.bundles.push({
            path: path,
            bundle: bundle
        });
    };
    Transaction.prototype.getBundles = function () {
        var _this = this;
        this.options.bundle.forEach(function (b) {
            if (fs.lstatSync(b).isDirectory()) {
                fs.readdirSync(b)
                    .filter(function (f) { return f.toLowerCase().endsWith('.xml') || f.toLowerCase().endsWith('.json'); })
                    .forEach(function (f) { return _this.addBundle(path.join(b, f)); });
            }
            else {
                if (!b.toLowerCase().endsWith('.xml') && !b.toLowerCase().endsWith('.json')) {
                    (0, helper_1.log)("Skipping ".concat(b, " because it is not an XML or JSON file"));
                    return;
                }
                _this.addBundle(b);
            }
        });
    };
    Transaction.prototype.executeBundle = function (bundle) {
        return __awaiter(this, void 0, void 0, function () {
            var options;
            var _this = this;
            return __generator(this, function (_a) {
                options = {
                    body: bundle,
                    json: true
                };
                this.auth.authenticateRequest(options);
                return [2, new Promise(function (resolve, reject) {
                        try {
                            request.post(_this.options.fhirServer, options, function (err, res, body) {
                                if (err || body.resourceType === 'OperationOutcome') {
                                    reject(err || body);
                                }
                                else {
                                    resolve(body);
                                }
                            });
                        }
                        catch (ex) {
                            reject(ex);
                        }
                    })];
            });
        });
    };
    Transaction.prototype.getResponseOutcome = function (outcome) {
        if (!outcome || outcome.resourceType !== 'OperationOutcome' || !outcome.issue || !outcome.issue.length) {
            return '';
        }
        return '\n' + (outcome.issue || []).map(function (issue) {
            return "** ".concat(issue.severity, ": ").concat(issue.diagnostics);
        }).join('\n');
    };
    Transaction.prototype.logBundleResponse = function (path, results) {
        var _this = this;
        var goodEntries = (results.entry || []).filter(function (e) { return e.response && e.response.status && e.response.status.startsWith('2'); });
        var badEntries = (results.entry || []).filter(function (e) { return !e.response || !e.response.status || !e.response.status.startsWith('2'); });
        (0, helper_1.log)("Done executing ".concat(path, ". ").concat(goodEntries.length, " positive and ").concat(badEntries.length, " bad responses"));
        if (badEntries.length > 0) {
            var badOutput_1 = '\n';
            badEntries.forEach(function (e) {
                if (!e.response) {
                    badOutput_1 += '* No response\n';
                }
                else if (!e.response.status) {
                    badOutput_1 += '* Response without status\n';
                }
                else if (e.response.status) {
                    var outcome = _this.getResponseOutcome(e.response.outcome);
                    badOutput_1 += "* Response with status \"".concat(e.response.status, "\"").concat(outcome, "\n");
                }
            });
            (0, helper_1.log)(badOutput_1);
        }
    };
    Transaction.prototype.logOperationOutcome = function (results) {
        (results.issue || []).forEach(function (issue) {
            (0, helper_1.log)("".concat(issue.severity || 'ISSUE', ": ").concat(issue.diagnostics));
        });
    };
    Transaction.prototype.execute = function () {
        return __awaiter(this, void 0, void 0, function () {
            var activeTransactions, _loop_1, this_1, _i, _a, bundleInfo;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.auth = new auth_1.Auth();
                        return [4, this.auth.prepare(this.options.authConfig)];
                    case 1:
                        _b.sent();
                        this.getBundles();
                        activeTransactions = [];
                        _loop_1 = function (bundleInfo) {
                            var activeTransaction;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        if (!(activeTransactions.length >= (this_1.options.batchCount || 5))) return [3, 2];
                                        return [4, Promise.race(activeTransactions)];
                                    case 1:
                                        _c.sent();
                                        _c.label = 2;
                                    case 2:
                                        (0, helper_1.log)("Executing batch/transaction for ".concat(bundleInfo.path));
                                        activeTransaction = this_1.executeBundle(bundleInfo.bundle)
                                            .then(function (results) {
                                            _this.logBundleResponse(bundleInfo.path, results);
                                            activeTransactions.splice(activeTransactions.indexOf(activeTransaction), 1);
                                        })
                                            .catch(function (ex) {
                                            activeTransactions.splice(activeTransactions.indexOf(activeTransaction), 1);
                                            if (ex.resourceType === 'OperationOutcome') {
                                                (0, helper_1.log)("Response is OperationOutcome executing batch/transaction ".concat(bundleInfo.path, " due to"), true);
                                                _this.logOperationOutcome(ex);
                                            }
                                            else {
                                                (0, helper_1.log)("Error executing batch/transaction ".concat(bundleInfo.path, " due to: ").concat(ex.message || ex), true);
                                            }
                                        });
                                        activeTransactions.push(activeTransaction);
                                        return [2];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, _a = this.bundles;
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3, 5];
                        bundleInfo = _a[_i];
                        return [5, _loop_1(bundleInfo)];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3, 2];
                    case 5: return [4, Promise.all(activeTransactions)];
                    case 6:
                        _b.sent();
                        (0, helper_1.log)('Done');
                        return [2];
                }
            });
        });
    };
    Transaction.command = 'transaction <fhirServer>';
    Transaction.description = 'Execute a bundle as a transaction on the destination fhirServer';
    return Transaction;
}());
//# sourceMappingURL=transaction.js.map