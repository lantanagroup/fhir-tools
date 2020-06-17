"use strict";
exports.__esModule = true;
var fs = require("fs");
var _ = require("underscore");
var IdModel = (function () {
    function IdModel() {
    }
    return IdModel;
}());
var FixIds = (function () {
    function FixIds(bundle) {
        if (typeof bundle === 'string') {
            this.filePath = bundle;
            var fileContent = fs.readFileSync(this.filePath).toString();
            this.content = JSON.parse(fileContent);
        }
        else if (typeof bundle === 'object') {
            this.content = bundle;
        }
    }
    FixIds.prototype.updateReferences = function (obj) {
        if (obj instanceof Array) {
            var _loop_1 = function (i) {
                if (obj[i] instanceof Array || typeof obj[i] === 'object') {
                    this_1.updateReferences(obj[i]);
                }
                else if (typeof obj[i] === 'string') {
                    _.each(this_1.ids, function (id) {
                        if (obj[i].endsWith(id.resourceType + '/' + id.oldId)) {
                            obj[i] = id.resourceType + '/' + id.newId;
                        }
                    });
                }
            };
            var this_1 = this;
            for (var i = 0; i < obj.length; i++) {
                _loop_1(i);
            }
        }
        else if (typeof obj === 'object') {
            var matchingId = _.find(this.ids, function (id) { return id.resourceType === obj.resourceType && id.oldId === obj.id; });
            if (matchingId) {
                obj.id = matchingId.newId;
            }
            var _loop_2 = function (i) {
                if (obj[i] instanceof Array || typeof obj[i] === 'object') {
                    this_2.updateReferences(obj[i]);
                }
                else if (typeof obj[i] === 'string') {
                    _.each(this_2.ids, function (id) {
                        if (obj[i].endsWith(id.resourceType + '/' + id.oldId)) {
                            obj[i] = id.resourceType + '/' + id.newId;
                        }
                    });
                }
            };
            var this_2 = this;
            for (var _i = 0, _a = Object.keys(obj); _i < _a.length; _i++) {
                var i = _a[_i];
                _loop_2(i);
            }
        }
    };
    FixIds.prototype.fix = function () {
        (this.content.entry || [])
            .filter(function (entry, index) {
            entry.resource && entry.resource.id && entry.resource.id.match(/^\d+$/);
        })
            .map(function (entry) {
            return {
                resourceType: entry.resource.resourceType,
                oldId: entry.resource.id,
                newId: 't' + entry.resource.id
            };
        });
        this.updateReferences(this.content);
    };
    FixIds.prototype.save = function () {
        if (!this.filePath) {
            throw new Error('No file path specified to save to');
        }
        var fileContent = JSON.stringify(this.content, null);
        fs.writeFileSync(this.filePath, fileContent);
    };
    return FixIds;
}());
exports.FixIds = FixIds;
//# sourceMappingURL=fixids.js.map