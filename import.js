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
var request = require("request");
var helper_1 = require("./helper");
function joinUrl() {
    var parts = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        parts[_i] = arguments[_i];
    }
    var url = '';
    for (var i = 0; i < parts.length; i++) {
        var argument = parts[i].toString();
        if (url && !url.endsWith('/')) {
            url += '/';
        }
        url += argument.startsWith('/') ? argument.substring(1) : argument;
    }
    return url;
}
exports.joinUrl = joinUrl;
var Import = (function () {
    function Import(baseUrl) {
        this.baseUrl = baseUrl;
    }
    Import.prototype.buildUrl = function (resourceType, id, operation, params, separateArrayParams) {
        if (separateArrayParams === void 0) { separateArrayParams = false; }
        var path = this.baseUrl;
        if (!path) {
            return;
        }
        if (resourceType) {
            path = joinUrl(path, resourceType);
            if (id) {
                path = joinUrl(path, id);
            }
        }
        if (operation) {
            path = joinUrl(path, operation);
        }
        if (params) {
            var keys = Object.keys(params);
            var paramArray_1 = [];
            keys.forEach(function (key) {
                if (params[key] instanceof Array) {
                    var valueArray = params[key];
                    if (!separateArrayParams) {
                        paramArray_1.push(key + "=" + encodeURIComponent(valueArray.join(',')));
                    }
                    else {
                        valueArray.forEach(function (element) { return paramArray_1.push(key + "=" + encodeURIComponent(element)); });
                    }
                }
                else {
                    var value = params[key];
                    paramArray_1.push(key + "=" + encodeURIComponent(value));
                }
            });
            if (paramArray_1.length > 0) {
                path += '?' + paramArray_1.join('&');
            }
        }
        return path;
    };
    Import.prototype.update = function (resource) {
        return __awaiter(this, void 0, void 0, function () {
            var url, options;
            return __generator(this, function (_a) {
                url = this.buildUrl(resource.resourceType, resource.id);
                options = {
                    url: url,
                    method: resource.id ? 'PUT' : 'POST',
                    body: resource,
                    json: true
                };
                return [2, new Promise(function (resolve, reject) {
                        console.log("Creating/updating resource " + resource.resourceType + (resource.id ? '/' + resource.id : ''));
                        request(options, function (err, response) {
                            if (err) {
                                console.error("Error occurred creating/updating resource " + resource.resourceType + (resource.id ? '/' + resource.id : '') + ": " + err);
                                reject(err);
                            }
                            else if (response.statusCode !== 200 && response.statusCode !== 201) {
                                console.error("Error occurred creating/updating resource " + resource.resourceType + (resource.id ? '/' + resource.id : '') + ": status code " + response.statusCode + helper_1.parseOperationOutcome(response.body));
                                reject("Unexpected status code " + response.statusCode);
                            }
                            else {
                                console.log("Done creating/updating resource " + resource.resourceType + (resource.id ? '/' + resource.id : ''));
                                resolve(response.body);
                            }
                        });
                    })];
            });
        });
    };
    Import.prototype.execute = function (bundle) {
        return __awaiter(this, void 0, void 0, function () {
            var i, entry, ex_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!bundle || !bundle.entry || bundle.entry.length === 0) {
                            console.error('Input is either not a bundle or doesn\'t have any entries');
                            return [2];
                        }
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < bundle.entry.length)) return [3, 7];
                        entry = bundle.entry[i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4, this.update(entry.resource)];
                    case 3:
                        _a.sent();
                        return [3, 5];
                    case 4:
                        ex_1 = _a.sent();
                        return [3, 5];
                    case 5:
                        if (i % 10 === 1) {
                            console.log("Processed " + (i + 1) + " of " + bundle.entry.length);
                        }
                        _a.label = 6;
                    case 6:
                        i++;
                        return [3, 1];
                    case 7:
                        console.log('Done creating/updating all resources.');
                        return [2];
                }
            });
        });
    };
    return Import;
}());
exports.Import = Import;
//# sourceMappingURL=import.js.map