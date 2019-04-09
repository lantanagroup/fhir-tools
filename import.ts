import * as request from 'request';

export class Import {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    public execute(bundle: any) {
        request({
            url: this.baseUrl,
            method: 'POST',
            json: true,
            body: bundle
        }, (err, response, body) => {
            if (err) {
                console.error(err);
            } else {
                console.log(body);
            }
        });
    }
}