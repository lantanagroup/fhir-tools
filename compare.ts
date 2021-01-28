import {Export} from "./export";

export interface CompareOptions {
    fhir1_base: string;
    fhir2_base: string;
    page_size: number;
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
            resource_type: ['StructureDefinition']
        });
        await export1.execute(false);

        console.log(`Gathering resource from second FHIR server: ${this.options.fhir2_base}`);
        const export2 = await Export.newExporter({
            fhir_base: this.options.fhir2_base,
            page_size: this.options.page_size
        });
        await export2.execute(false);

        let issueCount = 0;

        export1.exportBundle.entry.forEach(e1 => {
            const found = export2.exportBundle.entry.find(e2 => e2.resource.resourceType === e1.resource.resourceType && e2.resource.id.toLowerCase() === e1.resource.id.toLowerCase());

            if (!found) {
                console.log(`${e1.resource.resourceType}/${e1.resource.id} is missing from the second FHIR server`);
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
