import * as request from 'request';
import {parseOperationOutcome} from "./helper";

export function joinUrl(...parts: string[]) {
    let url = '';

    for (let i = 0; i < parts.length; i++) {
        const argument = parts[i].toString();

        if (url && !url.endsWith('/')) {
            url += '/';
        }

        url += argument.startsWith('/') ? argument.substring(1) : argument;
    }

    return url;
}

export class Import {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private buildUrl(resourceType?: string, id?: string, operation?: string, params?: {[key: string]: any}, separateArrayParams = false) {
        let path = this.baseUrl;

        if (!path) {
            return;
        }

        if (resourceType) {
            path = joinUrl(path, resourceType);

            if (id) {
                path = joinUrl(path, id);
            }
        }

        if (operation) {
            path = joinUrl(path, operation);
        }

        if (params) {
            const keys = Object.keys(params);
            const paramArray: any[] = [];

            keys.forEach((key) => {
                if (params[key] instanceof Array) {
                    const valueArray = <any[]> params[key];

                    if (!separateArrayParams) {
                        paramArray.push(`${key}=${encodeURIComponent(valueArray.join(','))}`);
                    } else {
                        valueArray.forEach((element) => paramArray.push(`${key}=${encodeURIComponent(element)}`));
                    }
                } else {
                    const value = params[key];
                    paramArray.push(`${key}=${encodeURIComponent(value)}`);
                }
            });

            if (paramArray.length > 0) {
                path += '?' + paramArray.join('&');
            }
        }

        return path;
    }

    private async update(resource: any) {
        const url = this.buildUrl(resource.resourceType, resource.id);
        const options = {
            url: url,
            method: resource.id ? 'PUT' : 'POST',
            body: resource,
            json: true
        };

        return new Promise((resolve, reject) => {
            console.log(`Creating/updating resource ${resource.resourceType}${resource.id ? '/' + resource.id : ''}`);

            request(options, (err, response) => {
                if (err) {
                    console.error(`Error occurred creating/updating resource ${resource.resourceType}${resource.id ? '/' + resource.id : ''}: ${err}`);
                    reject(err);
                } else if (response.statusCode !== 200 && response.statusCode !== 201) {
                    console.error(`Error occurred creating/updating resource ${resource.resourceType}${resource.id ? '/' + resource.id : ''}: status code ${response.statusCode}${parseOperationOutcome(response.body)}`);
                    reject(`Unexpected status code ${response.statusCode}`);
                } else {
                    console.log(`Done creating/updating resource ${resource.resourceType}${resource.id ? '/' + resource.id : ''}`);
                    resolve(response.body);
                }
            });
        });
    }

    public async execute(bundle: any) {
        if (!bundle || !bundle.entry || bundle.entry.length === 0) {
            console.error('Input is either not a bundle or doesn\'t have any entries');
            return;
        }

        // Each resource is processed one at a time, intentionally.
        // The backup may include history, which requires that the bundle be processed in the correct order of entries to re-create the history.
        // Additionally, the FHIR server (if HAPI) may have issues with the meta.security tags being non-unique when creating multiple resources at the same time.
        for (let i = 0; i < bundle.entry.length; i++) {
            const entry = bundle.entry[i];

            try {
                await this.update(entry.resource);
            } catch (ex) {}

            if (i % 10 === 1) {
                console.log(`Processed ${i + 1} of ${bundle.entry.length}`);
            }
        }

        console.log('Done creating/updating all resources.');
    }
}