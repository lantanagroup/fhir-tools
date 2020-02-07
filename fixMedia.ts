export class FixMedia {
    private bundle: any;

    constructor(bundle: any) {
        this.bundle = bundle;
    }

    execute() {
        // when media.content.data exists, media.content.contentType has to exist. default to image/jpeg
        const matching = (this.bundle.entry || [])
            .filter((entry: any) => entry.resource.resourceType === 'Media' && entry.resource.content && entry.resource.content.data && !entry.resource.content.contentType);

        console.log(`Fixing ${matching.length} Media resources that have content.data but not content.contentType`);

        matching
            .forEach((entry: any) => {
                entry.resource.content.contentType = 'image/jpeg';
            });
    }
}