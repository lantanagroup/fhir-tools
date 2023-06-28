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
exports.Transaction = void 0;
var auth_1 = require("./auth");
var path = require("path");
var fs = require("fs");
var fhir_1 = require("fhir/fhir");
var request = require("request");
var helper_1 = require("./helper");
var Transaction = (function () {
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
                    method: 'POST',
                    body: bundle,
                    json: true
                };
                this.auth.authenticateRequest(options);
                return [2, new Promise(function (resolve, reject) {
                        request(_this.options.fhirServer, options, function (err, res, body) {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(body);
                            }
                        });
                    })];
            });
        });
    };
    Transaction.prototype.execute = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, bundleInfo, results, goodEntries, badEntries, ex_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.auth = new auth_1.Auth();
                        return [4, this.auth.prepare(this.options.authConfig)];
                    case 1:
                        _b.sent();
                        this.getBundles();
                        _i = 0, _a = this.bundles;
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3, 7];
                        bundleInfo = _a[_i];
                        (0, helper_1.log)("Executing batch/transaction for ".concat(bundleInfo.path));
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 5, , 6]);
                        return [4, this.executeBundle(bundleInfo.bundle)];
                    case 4:
                        results = _b.sent();
                        goodEntries = (results.entry || []).filter(function (e) { return e.response && e.response.status && e.response.status.startsWith('2'); });
                        badEntries = (results.entry || []).filter(function (e) { return !e.response || !e.response.status && !e.response.status.startsWith('2'); });
                        (0, helper_1.log)("Done executing ".concat(bundleInfo.path, ". ").concat(goodEntries.length, " positive and ").concat(badEntries.length, " bad responses"));
                        if (badEntries.length > 0) {
                            (0, helper_1.log)("Bad responses:");
                            badEntries.forEach(function (e) {
                                if (!e.response) {
                                    (0, helper_1.log)('* No response');
                                }
                                else if (!e.response.status) {
                                    (0, helper_1.log)('* Response without status');
                                }
                                else if (e.response.status) {
                                    (0, helper_1.log)("* Response with status \"".concat(e.response.status, "\""));
                                }
                            });
                        }
                        return [3, 6];
                    case 5:
                        ex_1 = _b.sent();
                        (0, helper_1.log)("Error executing batch/transaction ".concat(bundleInfo.path, " due to: ").concat(ex_1.message || ex_1), true);
                        return [3, 6];
                    case 6:
                        _i++;
                        return [3, 2];
                    case 7:
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
exports.Transaction = Transaction;
//# sourceMappingURL=transaction.js.map