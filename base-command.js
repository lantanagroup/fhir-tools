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
exports.BaseCommand = void 0;
var request = require("request");
var BaseCommand = (function () {
    function BaseCommand() {
    }
    BaseCommand.prototype.handleResponseError = function (response, expected) {
        if (expected === void 0) { expected = 'Bundle'; }
        if (response && response.resourceType !== expected) {
            if (response.resourceType === 'OperationOutcome') {
                var ooError = response.issue ? response.issue.find(function (i) { return i.severity === 'error'; }) : null;
                if (ooError) {
                    throw new Error(ooError.diagnostics);
                }
            }
            throw new Error("Unexpected response");
        }
    };
    BaseCommand.prototype.doRequest = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (!options.headers) {
                    options.headers = {};
                }
                options.json = true;
                options.headers['Cache-Control'] = 'no-cache';
                options.headers['Content-Type'] = 'application/json';
                return [2, new Promise(function (resolve, reject) {
                        request(options, function (err, response, body) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                if (err) {
                                    return [2, reject(err)];
                                }
                                if (response.headers && response.headers['content-type'] && !response.headers['content-type'].startsWith('application/json') && !response.headers['content-type'].startsWith('application/spec+json') && !response.headers['content-type'].startsWith('application/fhir+json')) {
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
    BaseCommand.prototype.joinUrl = function () {
        var parts = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            parts[_i] = arguments[_i];
        }
        if (!parts || parts.length === 0) {
            return '';
        }
        var url = parts[0];
        for (var i = 1; i < parts.length; i++) {
            if (!parts[i])
                continue;
            if (!url.endsWith('/')) {
                url += '/';
            }
            url += parts[i].startsWith('/') ? parts[i].substring(1) : parts[i];
        }
        return url;
    };
    return BaseCommand;
}());
exports.BaseCommand = BaseCommand;
//# sourceMappingURL=base-command.js.map