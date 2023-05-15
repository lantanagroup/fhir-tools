export interface IExtension {
    extension?: IExtension[];
    url: string;
    valueString?: string;
}

export interface IReference {
    reference?: string;
    display?: string;
}

export interface IList {
    resourceType: 'List';
    extension?: IExtension[];
    status: 'current'|'retired'|'entered-in-error';
    mode: 'working'|'snapshot'|'changes';
    title?: string;
    entry?: {
        deleted?: boolean;
        date?: string;
        item: IReference;
    }[];
}
