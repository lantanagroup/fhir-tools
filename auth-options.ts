export class AuthOptions {
    type: 'basic'|'oauth'|'bearerToken';
    public token: string;
    public basic: {
        username: string;
        password: string;
    };
    public oauth: {
        grantType: 'client_credential';
        tokenUrl: string;
        clientId: string;
        secret: string;
        resource?: string;
    }
}
