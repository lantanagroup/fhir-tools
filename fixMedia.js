"use strict";
exports.__esModule = true;
var FixMedia = (function () {
    function FixMedia(bundle) {
        this.bundle = bundle;
    }
    FixMedia.prototype.execute = function () {
        var matching = (this.bundle.entry || [])
            .filter(function (entry) { return entry.resource.resourceType === 'Media' && entry.resource.content && entry.resource.content.data && !entry.resource.content.contentType; });
        console.log("Fixing " + matching.length + " Media resources that have content.data but not content.contentType");
        matching
            .forEach(function (entry) {
            entry.resource.content.contentType = 'image/jpeg';
        });
    };
    return FixMedia;
}());
exports.FixMedia = FixMedia;
//# sourceMappingURL=fixMedia.js.map