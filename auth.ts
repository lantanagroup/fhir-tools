import {AuthOptions} from "./auth-options";
import * as request from "request";
import {CoreOptions, post} from "request";
import * as fs from 'fs';
import {parse} from 'yaml';

export class Auth {
    private authHeader: string;

    public async prepare(optionsFile: string) {
        if (!optionsFile) {
            return;
        }

        const optionsContent = fs.readFileSync(optionsFile).toString();
        const options: AuthOptions = parse(optionsContent);

        switch (options.type) {
            case 'basic':
                if (options.basic) {
                    const token = btoa(options.basic.username + ':' + options.basic.password);
                    this.authHeader = `Basic ${token}`;
                }
                return;
            case 'oauth':
                if (options.oauth) {
                    switch (options.oauth.grantType) {
                        case 'client_credential':
                            const token = await this.getClientCredential(options.oauth.tokenUrl, options.oauth.clientId, options.oauth.secret, options.oauth.resource);
                            this.authHeader = `Bearer ${token}`;
                            return;
                    }
                }
                return;
        }
    }
    public authenticateRequest(reqOptions: CoreOptions) {
        if (this.authHeader) {
            if (!reqOptions.headers) {
                reqOptions.headers = {};
            }
            reqOptions.headers['Authorization'] = this.authHeader;
        }
    }

    private async getClientCredential(tokenUrl: string, clientId: string, secret: string, resource?: string): Promise<string> {
        const options = {
            json: true,
            form: <any> {
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: secret
            }
        };

        if (resource) {
            options.form.resource = resource;
        }

        return new Promise((resolve, reject) => {
            request(tokenUrl, options, (err, res, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(body.access_token);
                }
            });
        });
    }
}
