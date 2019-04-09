"use strict";
exports.__esModule = true;
var fs = require("fs");
var _ = require("underscore");
var FixR4 = (function () {
    function FixR4(bundle) {
        if (typeof bundle === 'string') {
            this.filePath = bundle;
            var fileContent = fs.readFileSync(this.filePath).toString();
            this.content = JSON.parse(fileContent);
        }
        else if (typeof bundle === 'object') {
            this.content = bundle;
        }
    }
    FixR4.prototype.fixBinary = function (binary) {
        if (binary.content) {
            binary.data = binary.content;
            delete binary.content;
        }
    };
    FixR4.prototype.fixResource = function (resource) {
        var _this = this;
        if (!resource)
            return;
        if (resource.resourceType === 'Binary') {
            this.fixBinary(resource);
        }
        _.each(resource.contained, function (contained) {
            _this.fixResource(contained);
        });
    };
    FixR4.prototype.fix = function () {
        var _this = this;
        _.each(this.content.entry, function (entry) { return _this.fixResource(entry.resource); });
    };
    FixR4.prototype.save = function () {
        if (!this.filePath) {
            throw new Error('No file path specified to save to');
        }
        var fileContent = JSON.stringify(this.content, null);
        fs.writeFileSync(this.filePath, fileContent);
    };
    return FixR4;
}());
exports.FixR4 = FixR4;
//# sourceMappingURL=fixR4.js.map