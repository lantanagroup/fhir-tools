"use strict";
exports.__esModule = true;
var request = require("request");
var Import = (function () {
    function Import(baseUrl) {
        this.baseUrl = baseUrl;
    }
    Import.prototype.execute = function (bundle) {
        request({
            url: this.baseUrl,
            method: 'POST',
            json: true,
            body: bundle
        }, function (err, response, body) {
            if (err) {
                console.error(err);
            }
            else {
                console.log(body);
            }
        });
    };
    return Import;
}());
exports.Import = Import;
//# sourceMappingURL=import.js.map