"use strict";
exports.__esModule = true;
exports.FixSubscriptions = void 0;
var FixSubscriptions = (function () {
    function FixSubscriptions(bundle) {
        this.bundle = bundle;
    }
    FixSubscriptions.prototype.execute = function () {
        var matching = (this.bundle.entry || [])
            .filter(function (entry) { return entry.resource.resourceType === 'Subscription' && entry.resource.criteria && entry.resource.criteria.indexOf('?') < 0; });
        console.log("Fixing " + matching.length + " Subscription resources missing ? in criteria");
        matching
            .forEach(function (entry) {
            if (entry.resource.criteria.indexOf('/') > 0) {
                var split = entry.resource.criteria.split('/');
                entry.resource.criteria = split[0] + '?_id=' + split[1];
            }
            else {
                entry.resource.criteria += '?';
            }
        });
    };
    return FixSubscriptions;
}());
exports.FixSubscriptions = FixSubscriptions;
//# sourceMappingURL=fixSubscriptions.js.map