"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCodeSystem = exports.CreateCodeSystemOptions = void 0;
var fs = require("fs");
var CreateCodeSystemOptions = (function () {
    function CreateCodeSystemOptions() {
        this.pretty = false;
    }
    return CreateCodeSystemOptions;
}());
exports.CreateCodeSystemOptions = CreateCodeSystemOptions;
var CreateCodeSystem = exports.CreateCodeSystem = (function () {
    function CreateCodeSystem(options) {
        this.options = options;
    }
    CreateCodeSystem.args = function (yargs) {
        return yargs
            .positional('type', {
            describe: 'Which code system is being created',
            choices: ['rxnorm', 'snomed']
        })
            .positional('path', {
            describe: 'The path to the source code system file to load and convert into a CodeSystem resource'
        })
            .positional('output', {
            describe: 'The output path where the JSON CodeSystem should be stored'
        })
            .option('pretty', {
            alias: 'p',
            type: 'boolean'
        });
    };
    CreateCodeSystem.handler = function (args) {
        var codeSystemCreator = new CreateCodeSystem(args);
        codeSystemCreator.execute();
    };
    CreateCodeSystem.prototype.rxnorm = function () {
        var lines = this.content.replace('\r', '').split('\n');
        this.codeSystem = {
            resourceType: 'CodeSystem',
            url: 'http://www.nlm.nih.gov/research/umls/rxnorm',
            status: 'active',
            content: 'complete',
            concept: []
        };
        this.codeSystem.concept = lines.map(function (line) {
            var parts = line.split('|');
            return {
                code: parts[7],
                display: parts[14]
            };
        });
    };
    CreateCodeSystem.prototype.snomed = function () {
        var lines = this.content.replace('\r', '').split('\n');
        this.codeSystem = {
            resourceType: 'CodeSystem',
            url: 'http://snomed.info/sct',
            status: 'active',
            content: 'complete',
            concept: []
        };
        this.codeSystem.concept = lines.map(function (line) {
            var parts = line.split('\t');
            return {
                code: parts[4],
                display: parts[7]
            };
        });
    };
    CreateCodeSystem.prototype.execute = function () {
        this.content = fs.readFileSync(this.options.path).toString();
        switch (this.options.type) {
            case 'rxnorm':
                this.rxnorm();
                break;
            case 'snomed':
                this.snomed();
                break;
            default:
                throw new Error("Type ".concat(this.options.type, " not supported"));
        }
        if (this.options.pretty) {
            fs.writeFileSync(this.options.output, JSON.stringify(this.codeSystem, null, '\t'));
        }
        else {
            fs.writeFileSync(this.options.output, JSON.stringify(this.codeSystem));
        }
    };
    CreateCodeSystem.command = 'codesystem <type> <path> <output>';
    CreateCodeSystem.description = 'Create a code system from a source file, such as RXNorm or SNOMED-CT. This command is VERY basic and does not currently account for many of the complexities of SNOMED and RXNORM code systems. This is only intended as a starting point and should not be used in production systems that require reliability.';
    return CreateCodeSystem;
}());
//# sourceMappingURL=create-code-system.js.map