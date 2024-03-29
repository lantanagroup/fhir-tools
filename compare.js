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
exports.Compare = void 0;
var export_1 = require("./export");
var Compare = exports.Compare = (function () {
    function Compare(options) {
        this.options = options;
    }
    Compare.args = function (yargs) {
        return yargs
            .positional('fhir1_base', {
            type: 'string',
            describe: 'The FHIR server base of the first FHIR server'
        })
            .positional('fhir2_base', {
            type: 'string',
            describe: 'The FHIR server base of the second FHIR server'
        })
            .option('page_size', {
            alias: 's',
            type: 'number',
            describe: 'The size of results to return per page',
            default: 50
        })
            .option('exclude', {
            alias: 'e',
            array: true,
            type: 'string',
            description: 'Resource types that should be excluded from the export (ex: AuditEvent)'
        })
            .option('history', {
            alias: 'h',
            boolean: true,
            description: 'Indicates if _history should be included'
        });
    };
    Compare.handler = function (args) {
        new Compare(args).execute()
            .then(function () { return process.exit(0); });
    };
    Compare.prototype.execute = function () {
        return __awaiter(this, void 0, void 0, function () {
            var export1, export2, issueCount;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Gathering resource from first FHIR server: ".concat(this.options.fhir1_base));
                        return [4, export_1.Export.newExporter({
                                fhir_base: this.options.fhir1_base,
                                page_size: this.options.page_size,
                                exclude: this.options.exclude,
                                history: this.options.history
                            })];
                    case 1:
                        export1 = _a.sent();
                        return [4, export1.execute(false)];
                    case 2:
                        _a.sent();
                        console.log("Gathering resource from second FHIR server: ".concat(this.options.fhir2_base));
                        return [4, export_1.Export.newExporter({
                                fhir_base: this.options.fhir2_base,
                                page_size: this.options.page_size,
                                exclude: this.options.exclude,
                                history: this.options.history
                            })];
                    case 3:
                        export2 = _a.sent();
                        return [4, export2.execute(false)];
                    case 4:
                        _a.sent();
                        issueCount = 0;
                        export1.exportBundle.entry.forEach(function (e1) {
                            var found = export2.exportBundle.entry.find(function (e2) {
                                if (e2.resource.resourceType !== e1.resource.resourceType)
                                    return false;
                                if (e2.resource.id !== e1.resource.id)
                                    return false;
                                if (_this.options.history && e2.resource.meta.versionId !== e1.resource.meta.versionId)
                                    return false;
                                return true;
                            });
                            if (!found) {
                                var identifier = _this.options.history ?
                                    "".concat(e1.resource.resourceType, "/").concat(e1.resource.id, "-").concat(e1.resource.meta.versionId) :
                                    "".concat(e1.resource.resourceType, "/").concat(e1.resource.id);
                                console.log("".concat(identifier, " is missing from the second FHIR server"));
                                issueCount++;
                            }
                        });
                        if (issueCount > 0) {
                            console.log("Found ".concat(issueCount, " issues when comparing."));
                        }
                        else {
                            console.log('Did not find any issues during comparison.');
                        }
                        return [2];
                }
            });
        });
    };
    Compare.command = 'compare <fhir1_base> <fhir2_base>';
    Compare.description = 'Compare the resources from one FHIR server to another';
    return Compare;
}());
//# sourceMappingURL=compare.js.map