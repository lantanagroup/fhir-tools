export class FixSubscriptions {
    private bundle: any;

    constructor(bundle: any) {
        this.bundle = bundle;
    }

    execute() {
        // fix subscription.criteria to include a ?
        const matching = (this.bundle.entry || [])
            .filter((entry: any) => entry.resource.resourceType === 'Subscription' && entry.resource.criteria && entry.resource.criteria.indexOf('?') < 0);

        console.log(`Fixing ${matching.length} Subscription resources missing ? in criteria`);

        matching
            .forEach((entry: any) => {
                if (entry.resource.criteria.indexOf('/') > 0) {
                    const split = entry.resource.criteria.split('/');
                    entry.resource.criteria = split[0] + '?_id=' + split[1];
                } else {
                    entry.resource.criteria += '?';
                }
            });
    }
}