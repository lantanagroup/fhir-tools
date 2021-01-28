export interface IBundleEntry {
    fullUrl?: string;
    resource?: any;
    request?: {
        method: string;
        url: string;
    }
}

export interface IBundle {
    resourceType: string;
    total?: number;
    type: string;
    entry?: IBundleEntry[];
}
