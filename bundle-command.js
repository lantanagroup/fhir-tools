"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BundleCommand = void 0;
var fs = require("fs");
var BundleCommand = exports.BundleCommand = (function () {
    function BundleCommand(options) {
        this.options = options;
    }
    BundleCommand.args = function (args) {
        return args
            .positional('type', {
            description: 'The type to set for the bundle',
            type: 'string',
            choices: ['batch', 'transaction', 'collection']
        })
            .positional('path', {
            description: 'The path to the bundle',
            type: 'string'
        })
            .option('pretty', {
            description: 'Whether to pretty-print the bundle when saving it back',
            type: 'boolean',
            default: false
        });
    };
    BundleCommand.handler = function (args) {
        new BundleCommand(args).execute();
    };
    BundleCommand.prototype.execute = function () {
        var content = fs.readFileSync(this.options.path).toString();
        var bundle = JSON.parse(content);
        if (!bundle || bundle.resourceType !== 'Bundle') {
            throw new Error('Path/content is not a Bundle');
        }
        bundle.type = this.options.type;
        if (this.options.type === 'batch' || this.options.type === 'transaction') {
            (bundle.entry || []).filter(function (e) { return e.resource && e.resource.resourceType; }).forEach(function (e) {
                e.request = {
                    method: e.resource.id ? 'PUT' : 'POST',
                    url: e.resource.resourceType + (e.resource.id ? '/' + e.resource.id : '')
                };
            });
        }
        else {
            (bundle.entry || []).forEach(function (e) { return delete e.request; });
        }
        if (this.options.pretty) {
            fs.writeFileSync(this.options.path, JSON.stringify(bundle, null, '\t'));
        }
        else {
            fs.writeFileSync(this.options.path, JSON.stringify(bundle));
        }
    };
    BundleCommand.command = 'bundle <type> <path>';
    BundleCommand.description = 'Updates an existing bundle to be a specific type of bundle. If batch or transaction, ensures that all entries have a request';
    return BundleCommand;
}());
//# sourceMappingURL=bundle-command.js.map