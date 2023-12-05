export interface IBundleEntry {
    fullUrl?: string;
    resource?: any;
    request?: {
        method: string;
        url: string;
    }
}

export interface IBundle {
    resourceType: 'Bundle';
    total?: number;
    type: string;
    entry?: IBundleEntry[];
    link?: {
        relation: string;
        url: string;
    }[];
}

export interface IOperationOutcome {
    resourceType: 'OperationOutcome';
    issue?: [{
        severity?: 'error'|'warning'|'information';
        diagnostics?: string;
    }]
}