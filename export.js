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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.Export = exports.ExportOptions = void 0;
var request = require("request");
var urljoin = require("url-join");
var fs = require("fs");
var semver = require("semver");
var helper_1 = require("./helper");
var auth_1 = require("./auth");
var JSONStream_1 = require("JSONStream");
var ExportOptions = (function () {
    function ExportOptions() {
        this.ig = false;
        this.history_queue = 10;
        this.xml = false;
        this.summary = false;
    }
    return ExportOptions;
}());
exports.ExportOptions = ExportOptions;
var Export = (function () {
    function Export(options) {
        this.maxHistoryQueue = 10;
        this.resourceTypes = [];
        this.bundles = {};
        this.options = options;
    }
    Export.args = function (yargs) {
        return yargs
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
    };
    Export.handler = function (args) {
        new Export(args).execute()
            .then(function () { return process.exit(0); });
    };
    Export.newExporter = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var exporter;
            return __generator(this, function (_a) {
                exporter = new Export(options);
                return [2, new Promise(function (resolve, reject) {
                        var metadataUrl = options.fhir_base + (options.fhir_base.endsWith('/') ? '' : '/') + 'metadata';
                        var metadataOptions = {
                            method: 'GET',
                            url: metadataUrl,
                            json: true
                        };
                        console.log("Checking ".concat(metadataUrl, " of server to determine version and resources"));
                        request(metadataOptions, function (err, response, metadata) {
                            if (err || response.statusCode != 200) {
                                reject('Error retrieving metadata from FHIR server');
                            }
                            else {
                                if (semver.satisfies(metadata.fhirVersion, '>= 3.2.0 < 4.2.0')) {
                                    exporter.version = 'r4';
                                }
                                else if (semver.satisfies(metadata.fhirVersion, '>= 1.1.0 <= 3.0.2')) {
                                    exporter.version = 'dstu3';
                                }
                                if (!options.resource_type || options.resource_type.length === 0) {
                                    (metadata.rest || []).forEach(function (rest) {
                                        (rest.resource || []).forEach(function (resource) {
                                            if (exporter.resourceTypes.indexOf(resource.type) < 0) {
                                                exporter.resourceTypes.push(resource.type);
                                            }
                                        });
                                    });
                                }
                                else {
                                    console.log('Using resource types specified by CLI options.');
                                    exporter.resourceTypes = options.resource_type;
                                }
                                if (options.exclude && options.exclude.length > 0) {
                                    console.log("Excluding ".concat(options.exclude.length, " resource types"));
                                    exporter.resourceTypes = exporter.resourceTypes
                                        .filter(function (resourceType) { return (options.exclude || []).indexOf(resourceType) < 0; });
                                }
                                exporter.resourceTypes
                                    .sort(function (a, b) { return a.localeCompare(b); });
                                console.log("Server is ".concat(exporter.version, ", found ").concat(exporter.resourceTypes.length, " resource types."));
                                resolve(exporter);
                            }
                        });
                    })];
            });
        });
    };
    Export.prototype.getIgResources = function (resources) {
        return __awaiter(this, void 0, void 0, function () {
            var body;
            var _this = this;
            return __generator(this, function (_a) {
                body = {
                    resourceType: 'Bundle',
                    type: 'batch',
                    entry: resources.map(function (r) {
                        return {
                            request: {
                                method: 'GET',
                                url: r.reference
                            }
                        };
                    })
                };
                return [2, new Promise(function (resolve, reject) {
                        var options = { method: 'POST', json: true, body: body };
                        _this.auth.authenticateRequest(options);
                        request(_this.options.fhir_base, options, function (err, response, body) {
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
    Export.prototype.getResource = function (resourceType, id) {
        return __awaiter(this, void 0, void 0, function () {
            var url;
            var _this = this;
            return __generator(this, function (_a) {
                url = this.options.fhir_base;
                if (resourceType && id) {
                    url += (this.options.fhir_base.endsWith('/') ? '' : '/') + resourceType + '/' + id;
                }
                else if (resourceType) {
                    url += (this.options.fhir_base.endsWith('/') ? '' : '/') + resourceType;
                }
                return [2, new Promise(function (resolve, reject) {
                        var options = { json: true };
                        _this.auth.authenticateRequest(options);
                        request(url, options, function (err, response, body) {
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
    Export.prototype.request = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2, new Promise(function (resolve, reject) {
                        var options = {
                            json: true,
                            headers: {
                                'Cache-Control': 'no-cache',
                                'Content-Type': 'application/json'
                            }
                        };
                        _this.auth.authenticateRequest(options);
                        request(url, options, function (err, response, body) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                if (err) {
                                    return [2, reject(err)];
                                }
                                if (response.headers && response.headers['content-type'] && !response.headers['content-type'].startsWith('application/json') && !response.headers['content-type'].startsWith('application/fhir+json')) {
                                    console.error('Response from FHIR server is not JSON!');
                                    return [2, reject('Response from FHIR server is not JSON!')];
                                }
                                resolve(body);
                                return [2];
                            });
                        }); });
                    })];
            });
        });
    };
    Export.getProtocol = function (url) {
        return url.substring(0, url.indexOf('://'));
    };
    Export.prototype.getBundle = function (nextUrl, resourceType) {
        return __awaiter(this, void 0, void 0, function () {
            var options, body, nextLink;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.bundles[resourceType]) {
                            this.bundles[resourceType] = [];
                        }
                        console.log("Requesting ".concat(nextUrl));
                        options = {};
                        this.auth.authenticateRequest(options);
                        return [4, this.request(nextUrl, options)];
                    case 1:
                        body = _a.sent();
                        if (body.entry && body.entry.length > 0) {
                            console.log("Found ".concat(body.entry.length, " ").concat(resourceType, " entries in bundle (Bundle.total = ").concat(body.total, ")"));
                            this.bundles[resourceType].push(body);
                        }
                        else {
                            console.log("No entries found for ".concat(resourceType));
                        }
                        nextLink = (body.link || []).find(function (link) { return link.relation === 'next'; });
                        if (!(nextLink && nextLink.url)) return [3, 3];
                        if (Export.getProtocol(nextUrl) !== Export.getProtocol(nextLink.url)) {
                            nextLink.url = Export.getProtocol(nextUrl) + nextLink.url.substring(Export.getProtocol(nextLink.url).length);
                        }
                        return [4, this.getBundle(nextLink.url, resourceType)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2];
                }
            });
        });
    };
    Export.prototype.processQueue = function () {
        return __awaiter(this, void 0, void 0, function () {
            var resourceType, nextUrl, totalEntries;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.resourceTypes.length === 0) {
                            return [2];
                        }
                        resourceType = this.resourceTypes.pop();
                        nextUrl = urljoin(this.options.fhir_base, resourceType);
                        nextUrl += '?_count=' + this.options.page_size.toString();
                        if (this.options.summary) {
                            nextUrl += "&_elements=".concat(resourceType, ".id");
                        }
                        console.log("----------------------------\r\nStarting retrieve for ".concat(resourceType));
                        return [4, this.getBundle(nextUrl, resourceType)];
                    case 1:
                        _a.sent();
                        return [4, this.processQueue()];
                    case 2:
                        _a.sent();
                        if (this.bundles[resourceType] && this.bundles[resourceType].length > 0 && this.bundles[resourceType][0].hasOwnProperty('total')) {
                            totalEntries = this.bundles[resourceType]
                                .reduce(function (previous, current) {
                                for (var _i = 0, _a = current.entry || []; _i < _a.length; _i++) {
                                    var entry = _a[_i];
                                    previous.push(entry);
                                }
                                return previous;
                            }, [])
                                .length;
                            if (totalEntries !== this.bundles[resourceType][0].total) {
                                console.error("Expected ".concat(this.bundles[resourceType][0].total, " but actually have ").concat(totalEntries, " for ").concat(resourceType));
                            }
                        }
                        return [2];
                }
            });
        });
    };
    Export.prototype.execute = function (shouldOutput) {
        if (shouldOutput === void 0) { shouldOutput = true; }
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, resourceType, bundles, _b, bundles_1, bundle, _c, _d, entry, igs, _loop_1, this_1, _e, igs_1, ig, fhir, outputContent, st_1;
            var _this = this;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        this.auth = new auth_1.Auth();
                        return [4, this.auth.prepare(this.options.auth_config)];
                    case 1:
                        _f.sent();
                        return [4, this.processQueue()];
                    case 2:
                        _f.sent();
                        this.exportBundle = {
                            resourceType: 'Bundle',
                            type: 'transaction',
                            total: 0,
                            entry: []
                        };
                        for (_i = 0, _a = Object.keys(this.bundles); _i < _a.length; _i++) {
                            resourceType = _a[_i];
                            bundles = this.bundles[resourceType];
                            for (_b = 0, bundles_1 = bundles; _b < bundles_1.length; _b++) {
                                bundle = bundles_1[_b];
                                for (_c = 0, _d = (bundle.entry || []); _c < _d.length; _c++) {
                                    entry = _d[_c];
                                    this.exportBundle.entry.push({
                                        resource: entry.resource,
                                        request: {
                                            method: 'PUT',
                                            url: "".concat(resourceType, "/").concat(entry.resource.id)
                                        }
                                    });
                                    this.exportBundle.total++;
                                }
                            }
                        }
                        if (!this.options.ig) return [3, 6];
                        igs = this.exportBundle.entry
                            .filter(function (tbe) { return tbe.resource.resourceType === 'ImplementationGuide'; })
                            .map(function (tbe) { return tbe.resource; });
                        _loop_1 = function (ig) {
                            var igResourcesBundle, igResourceReferences, igResourceReferences_1, foundIgResources, missingIgResources;
                            return __generator(this, function (_g) {
                                switch (_g.label) {
                                    case 0:
                                        igResourcesBundle = void 0;
                                        console.log("Searching for missing resources for the IG ".concat(ig.id));
                                        if (!(this_1.version === 'r4' && ig.definition && ig.definition.resource)) return [3, 2];
                                        igResourceReferences = ig.definition.resource
                                            .filter(function (r) { return r.reference && r.reference.reference; })
                                            .map(function (r) { return r.reference; });
                                        return [4, this_1.getIgResources(igResourceReferences)];
                                    case 1:
                                        igResourcesBundle = _g.sent();
                                        return [3, 4];
                                    case 2:
                                        if (!(this_1.version === 'dstu3')) return [3, 4];
                                        igResourceReferences_1 = [];
                                        (ig.package || []).forEach(function (p) {
                                            var nextResourceReferences = (p.resource || [])
                                                .filter(function (r) { return r.sourceReference && r.sourceReference.reference; })
                                                .map(function (r) { return r.sourceReference; });
                                            igResourceReferences_1 = igResourceReferences_1.concat(nextResourceReferences);
                                        });
                                        return [4, this_1.getIgResources(igResourceReferences_1)];
                                    case 3:
                                        igResourcesBundle = _g.sent();
                                        _g.label = 4;
                                    case 4:
                                        if (igResourcesBundle && igResourcesBundle.entry) {
                                            foundIgResources = igResourcesBundle.entry
                                                .filter(function (e) { return e.response && e.response.status === '200 OK'; })
                                                .map(function (e) { return e.resource; });
                                            missingIgResources = foundIgResources
                                                .filter(function (r) {
                                                return !_this.exportBundle.entry.find(function (tbe) {
                                                    return tbe.resource && tbe.resource.resourceType === r.resourceType && tbe.resource.id === r.id;
                                                });
                                            })
                                                .map(function (e) {
                                                return {
                                                    request: {
                                                        method: 'PUT',
                                                        resource: e.resource
                                                    }
                                                };
                                            });
                                            if (missingIgResources.length > 0) {
                                                this_1.exportBundle.entry = this_1.exportBundle.entry.concat(missingIgResources);
                                                console.log("Adding ".concat(missingIgResources.length, " resources not already in export for IG ").concat(ig.id));
                                            }
                                        }
                                        return [2];
                                }
                            });
                        };
                        this_1 = this;
                        _e = 0, igs_1 = igs;
                        _f.label = 3;
                    case 3:
                        if (!(_e < igs_1.length)) return [3, 6];
                        ig = igs_1[_e];
                        return [5, _loop_1(ig)];
                    case 4:
                        _f.sent();
                        _f.label = 5;
                    case 5:
                        _e++;
                        return [3, 3];
                    case 6:
                        if (!this.options.history) return [3, 8];
                        console.log('Getting history for resources');
                        return [4, this.getNextHistory(this.exportBundle, this.exportBundle.entry.map(function (e) { return e; }))];
                    case 7:
                        _f.sent();
                        console.log('Done exporting history for resources');
                        _f.label = 8;
                    case 8:
                        if (shouldOutput) {
                            if (this.options.xml) {
                                fhir = (0, helper_1.getFhirInstance)(this.version);
                                outputContent = fhir.objToXml(this.exportBundle);
                                fs.writeFileSync(this.options.out_file, outputContent);
                            }
                            else {
                                if (fs.existsSync(this.options.out_file)) {
                                    fs.unlinkSync(this.options.out_file);
                                }
                                st_1 = (0, JSONStream_1.stringify)();
                                st_1.pipe(fs.createWriteStream(this.options.out_file, { encoding: 'utf8' }));
                                this.exportBundle.entry.forEach(function (entry) { return st_1.write(entry.resource); });
                                st_1.end();
                            }
                            console.log('done!');
                        }
                        return [2];
                }
            });
        });
    };
    Export.prototype.getNextHistory = function (exportBundle, entries) {
        return __awaiter(this, void 0, void 0, function () {
            var nextEntries, promises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (entries.length === 0) {
                            return [2];
                        }
                        nextEntries = entries.slice(0, this.maxHistoryQueue);
                        entries.splice(0, nextEntries.length);
                        promises = nextEntries.map(function (e) { return _this.getHistory(exportBundle, e); });
                        return [4, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        console.log("Getting next ".concat(this.maxHistoryQueue, " resource's history. ").concat(entries.length, " left."));
                        return [4, this.getNextHistory(exportBundle, entries)];
                    case 2:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    Export.prototype.getHistory = function (exportBundle, exportEntry) {
        return __awaiter(this, void 0, void 0, function () {
            var options;
            var _this = this;
            return __generator(this, function (_a) {
                options = {
                    method: 'GET',
                    url: this.options.fhir_base + (this.options.fhir_base.endsWith('/') ? '' : '/') + exportEntry.request.url + '/_history',
                    json: true
                };
                return [2, new Promise(function (resolve, reject) {
                        _this.auth.authenticateRequest(options);
                        request(options, function (err, response, historyBundle) {
                            var _a;
                            if (err || !historyBundle || historyBundle.resourceType !== 'Bundle') {
                                resolve();
                                return;
                            }
                            var replacementHistory = (historyBundle.entry || [])
                                .filter(function (entry) { return entry.resource; })
                                .map(function (entry) {
                                return {
                                    request: {
                                        method: 'PUT',
                                        url: "".concat(entry.resource.resourceType, "/").concat(entry.resource.id)
                                    },
                                    resource: entry.resource
                                };
                            });
                            var integerVersions = replacementHistory.filter(function (y) { return y.resource.meta.versionId.match(/^\d+$/g); }).length === replacementHistory.length;
                            if (integerVersions) {
                                replacementHistory = replacementHistory
                                    .sort(function (a, b) {
                                    var aVersion = parseInt(a.resource.meta.versionId);
                                    var bVersion = parseInt(b.resource.meta.versionId);
                                    return aVersion < bVersion ? -1 : (aVersion > bVersion ? 1 : 0);
                                });
                            }
                            else {
                                replacementHistory = replacementHistory
                                    .sort(function (a, b) {
                                    var aVersion = a.resource.meta.versionId;
                                    var bVersion = b.resource.meta.versionId;
                                    return aVersion.localeCompare(bVersion);
                                });
                            }
                            if (replacementHistory.length > 1) {
                                var exportEntryIndex = exportBundle.entry.indexOf(exportEntry);
                                (_a = exportBundle.entry).splice.apply(_a, __spreadArray([exportEntryIndex, 1], replacementHistory, false));
                                console.log("Added ".concat(replacementHistory.length - 1, " history items for ").concat(exportEntry.resource.resourceType, "/").concat(exportEntry.resource.id));
                            }
                            resolve();
                        });
                    })];
            });
        });
    };
    Export.command = 'export <fhir_base> <out_file>';
    Export.description = 'Export data from a FHIR server';
    return Export;
}());
exports.Export = Export;
//# sourceMappingURL=export.js.map