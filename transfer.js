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
exports.Transfer = void 0;
var request = require("request");
var export_1 = require("./export");
var path = require("path");
var fs = require("fs");
var Transfer = (function () {
    function Transfer(options) {
        this.messages = [];
        this.options = options;
    }
    Transfer.prototype.updateResource = function (fhirBase, resource) {
        return __awaiter(this, void 0, void 0, function () {
            var url;
            var _this = this;
            return __generator(this, function (_a) {
                url = fhirBase + (fhirBase.endsWith('/') ? '' : '/') + resource.resourceType + '/' + resource.id;
                return [2, new Promise(function (resolve, reject) {
                        request({ url: url, method: 'PUT', body: resource, json: true }, function (err, response, body) {
                            if (err) {
                                if (body && body.resourceType === 'OperationOutcome' && !body.id) {
                                    var message = JSON.stringify(body);
                                    if (body.issue && body.issue.length > 0 && body.issue[0].diagnostics) {
                                        message = body.issue[0].diagnostics;
                                    }
                                    else if (body.text && body.text.div) {
                                        message = body.text.div;
                                    }
                                    _this.messages.push({
                                        message: message,
                                        resource: resource
                                    });
                                }
                                else {
                                    _this.messages.push({
                                        message: "An error was returned from the server: " + err,
                                        resource: resource
                                    });
                                }
                                reject(err);
                            }
                            else {
                                if (!body.resourceType) {
                                    _this.messages.push({
                                        message: 'Response for putting resource on destination server did not result in a resource: ' + JSON.stringify(body),
                                        resource: resource
                                    });
                                    resolve(body);
                                }
                                else if (body.resourceType === 'OperationOutcome' && !body.id) {
                                    var message = JSON.stringify(body);
                                    if (body.issue && body.issue.length > 0 && body.issue[0].diagnostics) {
                                        message = body.issue[0].diagnostics;
                                    }
                                    else if (body.text && body.text.div) {
                                        message = body.text.div;
                                    }
                                    _this.messages.push({
                                        message: message,
                                        resource: resource
                                    });
                                    reject(message);
                                }
                                else if (body.resourceType !== resource.resourceType) {
                                    _this.messages.push({
                                        message: 'Unexpected resource returned from server when putting resource on destination: ' + JSON.stringify(body),
                                        resource: resource
                                    });
                                    resolve(body);
                                }
                                else {
                                    resolve(body);
                                }
                            }
                        });
                    })];
            });
        });
    };
    Transfer.prototype.updateNext = function () {
        return __awaiter(this, void 0, void 0, function () {
            var nextEntry, nextResource, ex_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.exportedBundle.entry.length <= 0) {
                            return [2];
                        }
                        nextEntry = this.exportedBundle.entry.pop();
                        nextResource = nextEntry.resource;
                        console.log("Putting " + nextResource.resourceType + "/" + nextResource.id + " onto the destination FHIR server. " + this.exportedBundle.entry.length + " left...");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4, this.updateResource(this.options.fhir2_base, nextResource)];
                    case 2:
                        _a.sent();
                        return [3, 4];
                    case 3:
                        ex_1 = _a.sent();
                        console.log('Error putting resource on destination server: ' + ex_1.message);
                        return [3, 4];
                    case 4: return [4, this.updateNext()];
                    case 5:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    Transfer.prototype.execute = function () {
        return __awaiter(this, void 0, void 0, function () {
            var exporter;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('Retrieving resources from the source FHIR server');
                        return [4, export_1.Export.newExporter({
                                fhir_base: this.options.fhir1_base,
                                page_size: this.options.page_size,
                                history: this.options.history,
                                exclude: this.options.exclude
                            })];
                    case 1:
                        exporter = _a.sent();
                        return [4, exporter.execute(false)];
                    case 2:
                        _a.sent();
                        console.log('Done retrieving resources');
                        this.exportedBundle = exporter.exportBundle;
                        return [4, this.updateNext()];
                    case 3:
                        _a.sent();
                        if (this.messages && this.messages.length > 0) {
                            console.log('Found the following issues when transferring:');
                            if (!fs.existsSync(path.join(__dirname, 'issues'))) {
                                fs.mkdirSync(path.join(__dirname, 'issues'));
                            }
                            this.messages.forEach(function (m) {
                                var identifier = _this.options.history ?
                                    m.resource.resourceType + "-" + m.resource.id + "-" + m.resource.meta.versionId :
                                    m.resource.resourceType + "-" + m.resource.id;
                                console.log(identifier + ": " + m.message);
                                var fileName = identifier + ".json";
                                fs.writeFileSync(path.join(__dirname, 'issues', fileName), JSON.stringify(m.resource, null, '\t'));
                            });
                        }
                        return [2];
                }
            });
        });
    };
    return Transfer;
}());
exports.Transfer = Transfer;
//# sourceMappingURL=transfer.js.map