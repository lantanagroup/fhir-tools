"use strict";
exports.__esModule = true;
function parseOperationOutcome(oo) {
    if (oo && oo.resourceType === 'OperationOutcome') {
        if (oo.issue && oo.issue.length > 0) {
            return '\r\n' + oo.issue.map(function (i) { return '- ' + i.diagnostics; }).join('\r\n');
        }
        else if (oo.text && oo.text.div) {
            return '\r\n' + oo.text.div;
        }
    }
    return '';
}
exports.parseOperationOutcome = parseOperationOutcome;
//# sourceMappingURL=helper.js.map