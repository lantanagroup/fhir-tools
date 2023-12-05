"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseOperationOutcome = exports.getFhirInstance = exports.log = void 0;
var fhir_1 = require("fhir/fhir");
var parseConformance_1 = require("fhir/parseConformance");
var fs = require("fs");
var path = require("path");
function log(message, error) {
    if (error === void 0) { error = false; }
    var msg = (new Date().toISOString()) + ' - ' + message;
    var func = error ? console.error : console.log;
    func(msg);
}
exports.log = log;
function getFhirInstance(version) {
    if (version === void 0) { version = 'r4'; }
    var fhir;
    if (version === 'dstu3') {
        var parser = new parseConformance_1.ParseConformance();
        var codeSystem3166 = JSON.parse(fs.readFileSync(path.join(__dirname, 'spec/stu3/codesystem-iso3166.json')).toString());
        var profilesResources = JSON.parse(fs.readFileSync(path.join(__dirname, 'spec/stu3/profiles-resources.json')).toString());
        var profilesTypes = JSON.parse(fs.readFileSync(path.join(__dirname, 'spec/stu3/profiles-types.json')).toString());
        var valueSets = JSON.parse(fs.readFileSync(path.join(__dirname, 'spec/stu3/valuesets.json')).toString());
        parser.loadCodeSystem(codeSystem3166);
        parser.parseBundle(profilesResources);
        parser.parseBundle(profilesTypes);
        parser.parseBundle(valueSets);
        fhir = new fhir_1.Fhir(parser);
    }
    else if (version === 'r4') {
        fhir = new fhir_1.Fhir();
    }
    return fhir;
}
exports.getFhirInstance = getFhirInstance;
function parseOperationOutcome(oo) {
    if (oo && oo.resourceType === 'OperationOutcome') {
        if (oo.issue && oo.issue.length > 0) {
            return '\r\n' + oo.issue.map(function (i) { return '- ' + i.diagnostics; }).join('\r\n');
        }
        else if (oo.text && oo.text.div) {
            return '\r\n' + oo.text.div;
        }
    }
    return '';
}
exports.parseOperationOutcome = parseOperationOutcome;
//# sourceMappingURL=helper.js.map