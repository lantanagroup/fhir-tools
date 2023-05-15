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
exports.CreateBundle = void 0;
var fs = require("fs");
var request = require("request");
var tar = require("tar");
var zlib_1 = require("zlib");
var streamifier = require("streamifier");
var fhir_1 = require("fhir/fhir");
var CreateBundle = (function () {
    function CreateBundle(options) {
        this.resources = [];
        this.fhir = new fhir_1.Fhir();
        this.options = options;
    }
    CreateBundle.args = function (args) {
        return args
            .positional('output', {
            description: 'The full path of the bundle that should be created as either JSON or XML'
        })
            .option('exclude', {
            description: 'Expression to be used to exclude files from the bundle',
            array: true
        })
            .option('path', {
            type: 'string',
            description: 'The path to the JSON Bundle file',
            array: true
        });
    };
    CreateBundle.handler = function (args) {
        new CreateBundle(args).execute()
            .then(function () { return process.exit(0); });
    };
    CreateBundle.prototype.getResourcesFromDirectory = function (directory) {
        var _this = this;
        fs.readdirSync(directory)
            .filter(function (fileName) {
            if (!fileName.toLowerCase().endsWith('.json') && !fileName.toLowerCase().endsWith('.xml')) {
                return false;
            }
            if (_this.options.exclude) {
                var shouldExclude = !!_this.options.exclude.find(function (exclude) {
                    var regex = new RegExp(exclude);
                    return regex.test(fileName);
                });
                if (shouldExclude) {
                    return false;
                }
            }
            return true;
        })
            .forEach(function (fileName) {
            var fileContent = fs.readFileSync(directory + '\\' + fileName).toString();
            var resource;
            try {
                if (fileName.toLowerCase().endsWith('.json')) {
                    resource = JSON.parse(fileContent);
                }
                else if (fileName.toLowerCase().endsWith('.xml')) {
                    resource = _this.fhir.xmlToObj(fileContent);
                }
            }
            catch (ex) {
                console.error("Error parsing ".concat(fileName, ": ").concat(ex.message || ex));
                return;
            }
            if (resource && resource.resourceType) {
                _this.resources.push(resource);
            }
        });
    };
    CreateBundle.prototype.getResourcesFromZip = function (buffer) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2, new Promise(function (resolve, reject) {
                        var parser = new tar.Parse();
                        var count = 0;
                        var skipList = ['package/other', 'package/example', 'package/openapi', 'package/package.json', 'package/.index.json'];
                        streamifier.createReadStream((0, zlib_1.unzipSync)(buffer))
                            .on('error', function (err) {
                            reject(err);
                        })
                            .on('end', function () {
                            console.log("Added ".concat(count, " resources from ZIP"));
                            resolve();
                        })
                            .pipe(parser)
                            .on('entry', function (entry) {
                            var entryPath = entry.header.path;
                            entry.on('data', function (data) {
                                if (!entryPath.toLowerCase().endsWith('.json')) {
                                    return;
                                }
                                var shouldSkip = skipList.find(function (sd) { return entryPath.toLowerCase().indexOf(sd) === 0; });
                                if (shouldSkip) {
                                    return;
                                }
                                console.log("Adding ".concat(entry.header.path, " from zip"));
                                var json = data.toString();
                                var resource;
                                try {
                                    resource = JSON.parse(json);
                                }
                                catch (ex) {
                                    console.error("Error parsing ".concat(entry.header.path, " as JSON: ").concat(ex));
                                    return;
                                }
                                if (resource.resourceType) {
                                    _this.resources.push(resource);
                                    count++;
                                }
                                else {
                                    console.error("".concat(entry.header.path, " is not a FHIR resource"));
                                }
                            });
                        });
                    })];
            });
        });
    };
    CreateBundle.prototype.getFromUrl = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, new Promise(function (resolve, reject) {
                        request({ url: url, encoding: null }, function (error, response, body) {
                            if (error) {
                                reject(error);
                            }
                            else {
                                resolve(body);
                            }
                        });
                    })];
            });
        });
    };
    CreateBundle.prototype.getResourcesFromPath = function (path) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(path.toLowerCase().indexOf('https://') >= 0 || path.toLowerCase().indexOf('http://') >= 0)) return [3, 3];
                        console.log("Getting resources from ".concat(path, " as a zip/tgz"));
                        return [4, this.getFromUrl(path)];
                    case 1:
                        results = _a.sent();
                        return [4, this.getResourcesFromZip(results)];
                    case 2:
                        _a.sent();
                        return [3, 7];
                    case 3:
                        if (!fs.lstatSync(path).isDirectory()) return [3, 4];
                        this.getResourcesFromDirectory(path);
                        return [3, 7];
                    case 4:
                        if (!(fs.existsSync(path) && path.toLowerCase().endsWith('.tgz'))) return [3, 6];
                        return [4, this.getResourcesFromZip(fs.readFileSync(path))];
                    case 5:
                        _a.sent();
                        console.log('Done adding');
                        return [3, 7];
                    case 6: throw new Error("Unexpected path ".concat(path));
                    case 7: return [2];
                }
            });
        });
    };
    CreateBundle.prototype.getResources = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, next;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _i = 0, _a = this.options.path;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3, 4];
                        next = _a[_i];
                        return [4, this.getResourcesFromPath(next)];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3, 1];
                    case 4: return [2];
                }
            });
        });
    };
    CreateBundle.prototype.execute = function () {
        return __awaiter(this, void 0, void 0, function () {
            var bundle, xml;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getResources()];
                    case 1:
                        _a.sent();
                        bundle = {
                            resourceType: 'Bundle',
                            type: 'batch',
                            entry: this.resources.map(function (resource) {
                                return {
                                    resource: resource,
                                    request: {
                                        method: 'PUT',
                                        url: "".concat(resource.resourceType, "/").concat(resource.id)
                                    }
                                };
                            })
                        };
                        this.resources.filter(function (r) {
                            var found = _this.resources.filter(function (next) { return next.id === r.id && next.resourceType === r.resourceType; });
                            if (found.length > 1) {
                                console.error("Resource ".concat(r.resourceType, "/").concat(r.id, " occurs ").concat(found.length, " times"));
                            }
                        });
                        console.log("Putting ".concat(bundle.entry.length, " resources into a Bundle"));
                        if (this.options.output.toLowerCase().endsWith('.json')) {
                            fs.writeFileSync(this.options.output, JSON.stringify(bundle));
                        }
                        else if (this.options.output.toLowerCase().endsWith('.xml')) {
                            xml = this.fhir.objToXml(bundle);
                            fs.writeFileSync(this.options.output, xml);
                        }
                        else {
                            console.error("Can't determine which format to convert the bundle to (XML or JSON) based on the output path: ".concat(this.options.output));
                        }
                        console.log("Saved bundle to ".concat(this.options.output));
                        return [2];
                }
            });
        });
    };
    CreateBundle.command = 'create-bundle <output>';
    CreateBundle.description = 'Creates a bundle from one or more paths in the form of directories, package.tgz files on the file system, or urls to package.tgz files';
    return CreateBundle;
}());
exports.CreateBundle = CreateBundle;
//# sourceMappingURL=create-bundle.js.map