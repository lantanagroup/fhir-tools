import * as request from 'request';

export class BaseCommand {
    protected handleResponseError(response: any, expected = 'Bundle') {
        if (response && response.resourceType !== expected) {
            if (response.resourceType === 'OperationOutcome') {
                const ooError = response.issue ? response.issue.find((i: any) => i.severity === 'error') : null;
                if (ooError) {
                    throw new Error(ooError.diagnostics);
                }
            }
            throw new Error(`Unexpected response`);
        }
    }

    protected async doRequest(options: any) {
        if (!options.headers) {
            options.headers = {};
        }

        options.json = true;
        options.headers['Cache-Control'] = 'no-cache';
        options.headers['Content-Type'] = 'application/json';

        return new Promise((resolve, reject) => {
            request(options, async (err: any, response: any, body: unknown) => {
                if (err) {
                    return reject(err);
                }

                if (response.headers && response.headers['content-type'] && !response.headers['content-type'].startsWith('application/json') && !response.headers['content-type'].startsWith('application/spec+json') && !response.headers['content-type'].startsWith('application/fhir+json')) {
                    console.error('Response from FHIR server is not JSON!');
                    return reject('Response from FHIR server is not JSON!');
                }

                resolve(body);
            });
        });
    }

    protected joinUrl(... parts: string[]): string {
        if (!parts || parts.length === 0) {
            return '';
        }

        let url = parts[0];

        for (let i = 1; i < parts.length; i++) {
            if (!parts[i]) continue;

            if (!url.endsWith('/')) {
                url += '/';
            }

            url += parts[i].startsWith('/') ? parts[i].substring(1) : parts[i];
        }

        return url;
    }
}