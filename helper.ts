export function parseOperationOutcome(oo: any): string {
    if (oo && oo.resourceType === 'OperationOutcome') {
        if (oo.issue && oo.issue.length > 0) {
            return '\r\n' + oo.issue.map((i: any) => '- ' + i.diagnostics).join('\r\n');
        } else if (oo.text && oo.text.div) {
            return '\r\n' + oo.text.div;
        }
    }

    return '';
}