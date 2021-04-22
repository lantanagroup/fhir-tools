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
exports.Delete = void 0;
var export_1 = require("./export");
var request = require("request");
var Delete = (function () {
    function Delete(options) {
        this.options = options;
    }
    Delete.prototype.request = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2, new Promise(function (resolve, reject) {
                        request(options, function (err, response, body) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                if (err) {
                                    return [2, reject(err)];
                                }
                                resolve(body);
                                return [2];
                            });
                        }); });
                    })];
            });
        });
    };
    Delete.prototype.execute = function () {
        return __awaiter(this, void 0, void 0, function () {
            var exporter, resourceTypes, _loop_1, this_1, _i, resourceTypes_1, resourceType, expungeResults;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, export_1.Export.newExporter({
                            fhir_base: this.options.fhir_base,
                            page_size: this.options.page_size,
                            exclude: this.options.exclude,
                            history: false,
                            summary: true
                        })];
                    case 1:
                        exporter = _a.sent();
                        return [4, exporter.execute(false)];
                    case 2:
                        _a.sent();
                        resourceTypes = exporter.exportBundle.entry.reduce(function (prev, curr) {
                            if (prev.indexOf(curr.resource.resourceType) < 0) {
                                prev.push(curr.resource.resourceType);
                            }
                            return prev;
                        }, []);
                        _loop_1 = function (resourceType) {
                            var bundle, deleteResults, ex_1;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        bundle = {
                                            resourceType: 'Bundle',
                                            type: 'transaction',
                                            entry: exporter.exportBundle.entry
                                                .filter(function (e) { return e.resource.resourceType === resourceType; })
                                                .map(function (e) {
                                                return {
                                                    request: {
                                                        method: 'DELETE',
                                                        url: resourceType + '/' + e.resource.id
                                                    }
                                                };
                                            })
                                        };
                                        _b.label = 1;
                                    case 1:
                                        _b.trys.push([1, 3, , 4]);
                                        return [4, this_1.request({
                                                method: 'POST',
                                                url: this_1.options.fhir_base,
                                                json: true,
                                                body: bundle
                                            })];
                                    case 2:
                                        deleteResults = _b.sent();
                                        console.log("Deleted " + deleteResults.entry.length + " resources for resource type " + resourceType);
                                        return [3, 4];
                                    case 3:
                                        ex_1 = _b.sent();
                                        console.error("Failed to delete resources for " + resourceType + " due to: " + ex_1.message);
                                        return [3, 4];
                                    case 4: return [2];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, resourceTypes_1 = resourceTypes;
                        _a.label = 3;
                    case 3:
                        if (!(_i < resourceTypes_1.length)) return [3, 6];
                        resourceType = resourceTypes_1[_i];
                        return [5, _loop_1(resourceType)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3, 3];
                    case 6:
                        if (!this.options.expunge) return [3, 8];
                        console.log('Expunging...');
                        return [4, this.request({
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
                    case 7:
                        expungeResults = _a.sent();
                        console.log("Done expunging. Server responded with " + expungeResults.resourceType);
                        _a.label = 8;
                    case 8:
                        console.log('Done');
                        return [2];
                }
            });
        });
    };
    return Delete;
}());
exports.Delete = Delete;
//# sourceMappingURL=delete.js.map