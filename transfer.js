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
var helper_1 = require("./helper");
var util = require("util");
var Transfer = (function () {
    function Transfer(options) {
        this.messages = [];
        this.sleep = util.promisify(setTimeout);
        this.options = options;
    }
    Transfer.prototype.requestUpdate = function (fhirBase, resource) {
        return __awaiter(this, void 0, void 0, function () {
            var url;
            var _this = this;
            return __generator(this, function (_a) {
                url = fhirBase + (fhirBase.endsWith('/') ? '' : '/') + resource.resourceType + '/' + resource.id;
                resource.id = resource.id.trim();
                if (resource.resourceType === 'Bundle' && !resource.type) {
                    resource.type = 'collection';
                }
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
                                        resource: resource,
                                        response: body
                                    });
                                }
                                else {
                                    _this.messages.push({
                                        message: "An error was returned from the server: " + err,
                                        resource: resource,
                                        response: body
                                    });
                                }
                                resolve(err);
                            }
                            else {
                                if (!body.resourceType) {
                                    _this.messages.push({
                                        message: 'Response for putting resource on destination server did not result in a resource: ' + JSON.stringify(body),
                                        resource: resource,
                                        response: body
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
                                        resource: resource,
                                        response: body
                                    });
                                    resolve(message);
                                }
                                else if (body.resourceType !== resource.resourceType) {
                                    _this.messages.push({
                                        message: 'Unexpected resource returned from server when putting resource on destination: ' + JSON.stringify(body),
                                        resource: resource,
                                        response: body
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
    Transfer.prototype.updateReferences = function (resource) {
        return __awaiter(this, void 0, void 0, function () {
            var references, _loop_1, this_1, _i, references_1, reference;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        references = this.getResourceReferences(resource);
                        if (references.length > 0) {
                            console.log("Found " + references.length + " references to store on the destination server first");
                        }
                        _loop_1 = function (reference) {
                            var foundResourceInfo, foundResourceInfoIndex;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        foundResourceInfo = this_1.resources.find(function (r) { return r.resourceType === reference.resourceType && r.id === reference.id; });
                                        if (!foundResourceInfo) return [3, 2];
                                        foundResourceInfoIndex = this_1.resources.indexOf(foundResourceInfo);
                                        this_1.resources.splice(foundResourceInfoIndex, 1);
                                        return [4, this_1.updateResource(foundResourceInfo.resourceType, foundResourceInfo.id)];
                                    case 1:
                                        _b.sent();
                                        _b.label = 2;
                                    case 2: return [2];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, references_1 = references;
                        _a.label = 1;
                    case 1:
                        if (!(_i < references_1.length)) return [3, 4];
                        reference = references_1[_i];
                        return [5, _loop_1(reference)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3, 1];
                    case 4: return [2];
                }
            });
        });
    };
    Transfer.prototype.updateResource = function (resourceType, id) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var versionEntries, _i, versionEntries_1, versionEntry, resourceReferences, _c, resourceReferences_1, resourceReference, validStatuses;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        versionEntries = this.exportedBundle.entry
                            .filter(function (e) { return e.resource.resourceType === resourceType && e.resource.id === id; });
                        console.log("Putting resource " + resourceType + "/" + id + " on destination server (" + versionEntries.length + " versions)");
                        _i = 0, versionEntries_1 = versionEntries;
                        _d.label = 1;
                    case 1:
                        if (!(_i < versionEntries_1.length)) return [3, 5];
                        versionEntry = versionEntries_1[_i];
                        resourceReferences = this.getResourceReferences(versionEntry.resource);
                        for (_c = 0, resourceReferences_1 = resourceReferences; _c < resourceReferences_1.length; _c++) {
                            resourceReference = resourceReferences_1[_c];
                            if (resourceReference.resourceType.trim() !== resourceReference.resourceType || resourceReference.id.trim() !== resourceReference.id) {
                                resourceReference.reference.reference = resourceReference.resourceType.trim() + '/' + resourceReference.id.trim();
                            }
                        }
                        return [4, this.updateReferences(versionEntry.resource)];
                    case 2:
                        _d.sent();
                        if (versionEntry.resource.contained) {
                            versionEntry.resource.contained
                                .filter(function (c) { return c.resourceType === 'Binary' && !c.data && c._data; })
                                .forEach(function (c) { return delete c._data; });
                        }
                        if (versionEntry.resource.resourceType === 'Bundle' && !versionEntry.resource.type) {
                            versionEntry.resource.type = 'collection';
                        }
                        if (versionEntry.resource.resourceType === 'ValueSet' && versionEntry !== versionEntries[versionEntries.length - 1]) {
                            delete versionEntry.resource.version;
                        }
                        if (versionEntry.resource.resourceType === 'MedicationAdministration') {
                            validStatuses = ['in-progress', 'not-done', 'on-hold', 'completed', 'entered-in-error', 'stopped', 'unknown'];
                            if (validStatuses.indexOf(versionEntry.resource.status) < 0) {
                                versionEntry.resource.status = 'unknown';
                            }
                        }
                        console.log("Putting resource " + resourceType + "/" + id + "#" + (((_a = versionEntry.resource.meta) === null || _a === void 0 ? void 0 : _a.versionId) || '1') + "...");
                        return [4, this.requestUpdate(this.options.destination, versionEntry.resource)];
                    case 3:
                        _d.sent();
                        console.log("Done putting resource " + resourceType + "/" + id + "#" + (((_b = versionEntry.resource.meta) === null || _b === void 0 ? void 0 : _b.versionId) || '1'));
                        _d.label = 4;
                    case 4:
                        _i++;
                        return [3, 1];
                    case 5: return [2];
                }
            });
        });
    };
    Transfer.prototype.updateNext = function () {
        return __awaiter(this, void 0, void 0, function () {
            var next;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.resources.length <= 0) {
                            return [2];
                        }
                        console.log("Getting next resource to update (" + this.resources.length + ")");
                        next = this.resources[0];
                        this.resources.splice(0, 1);
                        return [4, this.updateResource(next.resourceType, next.id)];
                    case 1:
                        _a.sent();
                        return [4, this.updateNext()];
                    case 2:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    Transfer.prototype.discoverResources = function () {
        var _this = this;
        this.resources = [];
        this.exportedBundle.entry
            .map(function (e) {
            return {
                resourceType: e.resource.resourceType,
                id: e.resource.id
            };
        })
            .forEach(function (e) {
            if (!_this.resources.find(function (u) { return u.resourceType === e.resourceType && u.id === e.id; })) {
                _this.resources.push(e);
            }
        });
    };
    Transfer.prototype.getResourceReferences = function (obj) {
        var references = [];
        if (!obj)
            return references;
        if (obj instanceof Array) {
            for (var i = 0; i < obj.length; i++) {
                references = references.concat(this.getResourceReferences(obj[i]));
            }
        }
        else if (typeof obj === 'object') {
            if (obj.reference && typeof obj.reference === 'string' && obj.reference.split('/').length === 2) {
                var split = obj.reference.split('/');
                references.push({
                    resourceType: split[0],
                    id: split[1],
                    reference: obj
                });
            }
            else {
                var keys = Object.keys(obj);
                for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                    var key = keys_1[_i];
                    references = references.concat(this.getResourceReferences(obj[key]));
                }
            }
        }
        return references;
    };
    Transfer.prototype.execute = function () {
        return __awaiter(this, void 0, void 0, function () {
            var exporter, exporter, fhir, subscriptions, activeSubscriptions, _loop_2, this_2, _i, activeSubscriptions_1, activeSubscription, issuesPath;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.options.source) return [3, 3];
                        console.log('Retrieving resources from the source FHIR server');
                        return [4, export_1.Export.newExporter({
                                fhir_base: this.options.source,
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
                        this.fhirVersion = exporter.version;
                        this.exportedBundle = exporter.exportBundle;
                        return [3, 6];
                    case 3:
                        if (!this.options.input_file) return [3, 5];
                        return [4, export_1.Export.newExporter({
                                fhir_base: this.options.destination,
                                page_size: this.options.page_size
                            })];
                    case 4:
                        exporter = _a.sent();
                        this.fhirVersion = exporter.version;
                        if (this.options.input_file.toLowerCase().endsWith('.xml')) {
                            fhir = helper_1.getFhirInstance(this.fhirVersion);
                            console.log('Parsing input file');
                            this.exportedBundle = fhir.xmlToObj(fs.readFileSync(this.options.input_file).toString());
                        }
                        else if (this.options.input_file.toLowerCase().endsWith('.json')) {
                            console.log('Parsing input file');
                            this.exportedBundle = JSON.parse(fs.readFileSync(this.options.input_file).toString());
                        }
                        else {
                            console.log('Unexpected file type for input_file');
                            return [2];
                        }
                        if (this.options.exclude) {
                            this.exportedBundle.entry = this.exportedBundle.entry.filter(function (e) {
                                return _this.options.exclude.indexOf(e.resource.resourceType) < 0;
                            });
                        }
                        return [3, 6];
                    case 5:
                        console.log('Either source or input_file must be specified');
                        return [2];
                    case 6:
                        this.discoverResources();
                        this.exportedBundle.entry
                            .map(function (e) { return e.resource; })
                            .forEach(function (ig) {
                            var references = _this.getResourceReferences(ig);
                            var notFoundReferences = references
                                .filter(function (r) { return !_this.resources.find(function (n) { return n.resourceType === r.resourceType && n.id.toLowerCase() === r.id.toLowerCase(); }); });
                            notFoundReferences
                                .filter(function (r) { return ['Bundle', 'ValueSet', 'ConceptMap', 'SearchParameter'].indexOf(r.resourceType) >= 0; })
                                .forEach(function (ref) {
                                var mockResource = {
                                    resourceType: ref.resourceType,
                                    id: ref.id
                                };
                                if (ref.resourceType === 'ValueSet' || ref.resourceType === 'ConceptMap') {
                                    mockResource.url = ig.url + ("/" + ref.resourceType + "/" + ref.id);
                                }
                                else if (ref.resourceType === 'Bundle') {
                                    mockResource.type = 'collection';
                                }
                                else if (ref.resourceType === 'SearchParameter') {
                                    mockResource.status = 'unknown';
                                }
                                _this.exportedBundle.entry.push({
                                    resource: mockResource
                                });
                                _this.resources.push(ref);
                            });
                        });
                        subscriptions = this.resources.filter(function (r) { return r.resourceType === 'Subscription'; });
                        activeSubscriptions = subscriptions
                            .filter(function (r) {
                            var resourceVersions = _this.exportedBundle.entry
                                .filter(function (e) { return e.resource.resourceType === r.resourceType && e.resource.id.toLowerCase() === r.id.toLowerCase(); });
                            var activeVersions = resourceVersions.filter(function (rv) { return rv.resource.status === 'active' || rv.resource.status === 'requested'; });
                            if (activeVersions.length > 0) {
                                return activeVersions.indexOf(resourceVersions[resourceVersions.length - 1]) >= 0;
                            }
                        });
                        subscriptions.forEach(function (r) {
                            _this.exportedBundle.entry
                                .filter(function (e) { return e.resource.resourceType === r.resourceType && e.resource.id.toLowerCase() === r.id.toLowerCase(); })
                                .filter(function (rv) { return rv.resource.status === 'active' || rv.resource.status === 'requested'; })
                                .forEach(function (rv) { return rv.resource.status = 'off'; });
                        });
                        return [4, this.updateNext()];
                    case 7:
                        _a.sent();
                        _loop_2 = function (activeSubscription) {
                            var resourceVersions, lastVersion;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        resourceVersions = this_2.exportedBundle.entry
                                            .filter(function (e) { return e.resource.resourceType === activeSubscription.resourceType && e.resource.id.toLowerCase() === activeSubscription.id.toLowerCase(); });
                                        lastVersion = resourceVersions[resourceVersions.length - 1];
                                        lastVersion.resource.status = 'requested';
                                        console.log("Updating the status of Subscription/" + lastVersion.resource.id + " to turn the subscription on");
                                        return [4, this_2.requestUpdate(this_2.options.destination, lastVersion.resource)];
                                    case 1:
                                        _b.sent();
                                        console.log("Done updating the status of Subscription/" + lastVersion.resource.id);
                                        return [2];
                                }
                            });
                        };
                        this_2 = this;
                        _i = 0, activeSubscriptions_1 = activeSubscriptions;
                        _a.label = 8;
                    case 8:
                        if (!(_i < activeSubscriptions_1.length)) return [3, 11];
                        activeSubscription = activeSubscriptions_1[_i];
                        return [5, _loop_2(activeSubscription)];
                    case 9:
                        _a.sent();
                        _a.label = 10;
                    case 10:
                        _i++;
                        return [3, 8];
                    case 11:
                        if (this.messages && this.messages.length > 0) {
                            console.log('Found the following issues when transferring:');
                            if (!fs.existsSync(path.join(__dirname, 'issues'))) {
                                fs.mkdirSync(path.join(__dirname, 'issues'));
                            }
                            issuesPath = path.join(__dirname, 'issues-' +
                                new Date().toISOString()
                                    .replace(/\./g, '')
                                    .replace('T', '_')
                                    .replace(/[:]/g, '-')
                                    .substring(0, 19) +
                                '.json');
                            fs.writeFileSync(issuesPath, JSON.stringify(this.messages, null, '\t'));
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