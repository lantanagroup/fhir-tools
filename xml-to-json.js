"use strict";
exports.__esModule = true;
exports.XmlToJson = exports.XmlToJsonOptions = void 0;
var fhir_1 = require("fhir/fhir");
var fs = require("fs");
var path_1 = require("path");
var Prompt = require("prompt-sync");
var XmlToJsonOptions = (function () {
    function XmlToJsonOptions() {
        this.overwrite = false;
    }
    return XmlToJsonOptions;
}());
exports.XmlToJsonOptions = XmlToJsonOptions;
var XmlToJson = (function () {
    function XmlToJson(options) {
        this.fhir = new fhir_1.Fhir();
        this.prompt = Prompt({ sigint: true });
        this.options = options;
    }
    XmlToJson.args = function (args) {
        return args
            .option('path', {
            type: 'string',
            description: 'The directories or files to convert to JSON',
            array: true
        })
            .option('overwrite', {
            type: 'boolean',
            description: 'Always overwrite destination, and do not prompt if the output path for each JSON file already exists',
            "default": false
        });
    };
    XmlToJson.handler = function (args) {
        new XmlToJson(args).execute();
    };
    XmlToJson.prototype.convert = function (filePath) {
        if (!filePath || !filePath.toLowerCase().endsWith('.xml')) {
            return;
        }
        var xml = fs.readFileSync(filePath).toString();
        var json = this.fhir.xmlToJson(xml);
        var newFilePath = filePath.substring(0, filePath.lastIndexOf('.') + 1) + 'json';
        if (!fs.existsSync(newFilePath) || this.options.overwrite || this.prompt("Overwrite ".concat(newFilePath, "? (y|N)")).trim().toLowerCase() === 'y') {
            fs.writeFileSync(newFilePath, json);
            console.log("Saved ".concat(newFilePath));
        }
    };
    XmlToJson.prototype.execute = function () {
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
    XmlToJson.command = 'xml-to-json';
    XmlToJson.description = 'Converts a XML file (or all XML files in a directory) to JSON. Stores the JSON file as the same file name as the XML file, but with a JSON extension, instead.';
    return XmlToJson;
}());
exports.XmlToJson = XmlToJson;
//# sourceMappingURL=xml-to-json.js.map