import {Export} from "./export";

export interface CompareOptions {
    fhir1_base: string;
    fhir2_base: string;
    page_size: number;
    exclude?: string[];
    history?: boolean;
}

export class Compare {
    private options: CompareOptions;

    constructor(options: CompareOptions) {
        this.options = options;
    }

    public async execute() {
        console.log(`Gathering resource from first FHIR server: ${this.options.fhir1_base}`);

        const export1 = await Export.newExporter({
            fhir_base: this.options.fhir1_base,
            page_size: this.options.page_size,
            exclude: this.options.exclude,
            history: this.options.history
        });
        await export1.execute(false);

        console.log(`Gathering resource from second FHIR server: ${this.options.fhir2_base}`);
        const export2 = await Export.newExporter({
            fhir_base: this.options.fhir2_base,
            page_size: this.options.page_size,
            exclude: this.options.exclude,
            history: this.options.history
        });
        await export2.execute(false);

        let issueCount = 0;

        export1.exportBundle.entry.forEach(e1 => {
            const found = export2.exportBundle.entry.find(e2 => {
                if (e2.resource.resourceType !== e1.resource.resourceType) return false;
                if (e2.resource.id !== e1.resource.id) return false;
                if (this.options.history && e2.resource.meta.versionId !== e1.resource.meta.versionId) return false;
                return true;
            });

            if (!found) {
                const identifier = this.options.history ?
                    `${e1.resource.resourceType}/${e1.resource.id}-${e1.resource.meta.versionId}` :
                    `${e1.resource.resourceType}/${e1.resource.id}`;
                console.log(`${identifier} is missing from the second FHIR server`);
                issueCount++;
            }
        });

        if (issueCount > 0) {
            console.log(`Found ${issueCount} issues when comparing.`);
        } else {
            console.log('Did not find any issues during comparison.');
        }
    }
}
