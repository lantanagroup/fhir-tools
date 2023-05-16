"use strict";
exports.__esModule = true;
exports.JsonToXml = exports.JsonToXmlOptions = void 0;
var fhir_1 = require("fhir/fhir");
var fs = require("fs");
var path_1 = require("path");
var Prompt = require("prompt-sync");
var JsonToXmlOptions = (function () {
    function JsonToXmlOptions() {
        this.overwrite = false;
    }
    return JsonToXmlOptions;
}());
exports.JsonToXmlOptions = JsonToXmlOptions;
var JsonToXml = (function () {
    function JsonToXml(options) {
        this.fhir = new fhir_1.Fhir();
        this.prompt = Prompt({ sigint: true });
        this.options = options;
    }
    JsonToXml.args = function (args) {
        return args
            .option('path', {
            type: 'string',
            description: 'The directories or files to convert to XML',
            array: true
        })
            .option('overwrite', {
            type: 'boolean',
            description: 'Always overwrite destination, and do not prompt if the output path for each XML file already exists',
            "default": false
        });
    };
    JsonToXml.handler = function (args) {
        new JsonToXml(args).execute();
    };
    JsonToXml.prototype.convert = function (filePath) {
        if (!filePath || !filePath.toLowerCase().endsWith('.json')) {
            return;
        }
        var json = fs.readFileSync(filePath).toString();
        var xml = this.fhir.jsonToXml(json);
        var newFilePath = filePath.substring(0, filePath.lastIndexOf('.') + 1) + 'xml';
        if (!fs.existsSync(newFilePath) || this.options.overwrite || this.prompt("Overwrite ".concat(newFilePath, "? (y|N)")).trim().toLowerCase() === 'y') {
            fs.writeFileSync(newFilePath, xml);
            console.log("Saved ".concat(newFilePath));
        }
    };
    JsonToXml.prototype.execute = function () {
        var _this = this;
        if (!this.options || !this.options.path || this.options.path.length <= 0) {
            return;
        }
        this.options.path.forEach(function (path) {
            if (!fs.existsSync(path)) {
                return;
            }
            if (fs.lstatSync(path).isDirectory()) {
                fs.readdirSync(path)
                    .forEach(function (next) { return _this.convert(path + path_1.sep + next); });
            }
            else {
                _this.convert(path);
            }
        });
    };
    JsonToXml.command = 'json-to-xml';
    JsonToXml.description = 'Converts a JSON file (or all JSON files in a directory) to XML. Stores the XML file as the same file name as the JSON file, but with an XML extension, instead.';
    return JsonToXml;
}());
exports.JsonToXml = JsonToXml;
//# sourceMappingURL=json-to-xml.js.map