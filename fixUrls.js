"use strict";
exports.__esModule = true;
var shortid = require("shortid");
var FixUrls = (function () {
    function FixUrls(bundle) {
        this.bundle = bundle;
    }
    FixUrls.prototype.execute = function () {
        var _this = this;
        var duplicateUrls = (this.bundle.entry || [])
            .filter(function (entry) {
            if (!entry.resource || !entry.resource.url)
                return false;
            var found = _this.bundle.entry.filter(function (e) { return e !== entry && e.resource.url === entry.resource.url; });
            return found.length > 0;
        });
        console.log("Fixing " + duplicateUrls.length + " resources with duplicate URLs");
        duplicateUrls.forEach(function (entry, eIndex) {
            entry.resource.url += eIndex;
        });
        var missingUrls = (this.bundle.entry || [])
            .filter(function (entry) { return ['ValueSet', 'CodeSystem', 'StructureDefinition'].indexOf(entry.resource.resourceType) >= 0 && !entry.resource.url; });
        console.log("Fixing " + missingUrls.length + " resources with missing URLs");
        missingUrls
            .forEach(function (entry) {
            var uniqueId = shortid.generate();
            entry.resource.url = "http://www.test-" + entry.resource.resourceType + "-" + uniqueId + ".com";
        });
    };
    return FixUrls;
}());
exports.FixUrls = FixUrls;
//# sourceMappingURL=fixUrls.js.map