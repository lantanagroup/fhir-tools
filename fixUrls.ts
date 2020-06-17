import * as shortid from "shortid";

export class FixUrls {
    private bundle: any;

    constructor(bundle: any) {
        this.bundle = bundle;
    }

    public execute() {
        // fix duplicate value set urls
        const duplicateUrls = (this.bundle.entry || [])
            .filter((entry: any) => {
                if (!entry.resource || !entry.resource.url) return false;
                const found = this.bundle.entry.filter((e: any) => e !== entry && e.resource.url === entry.resource.url);
                return found.length > 0;
            });

        console.log(`Fixing ${duplicateUrls.length} resources with duplicate URLs`);

        duplicateUrls.forEach((entry: any, eIndex: number) => {
            entry.resource.url += eIndex;
        });

        // fix value sets that don't have a url
        const missingUrls = (this.bundle.entry || [])
            .filter((entry: any) => ['ValueSet', 'CodeSystem', 'StructureDefinition'].indexOf(entry.resource.resourceType) >= 0 && !entry.resource.url);

        console.log(`Fixing ${missingUrls.length} resources with missing URLs`);

        missingUrls
            .forEach((entry: any) => {
                const uniqueId = shortid.generate();
                entry.resource.url = `http://www.test-${entry.resource.resourceType}-${uniqueId}.com`;
            });
    }
}