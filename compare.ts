import {Export} from "./export";
import {Arguments, Argv} from "yargs";
import {BulkAnalyzeOptions} from "./bulk-analyze";

export interface CompareOptions {
    fhir1_base: string;
    fhir2_base: string;
    page_size: number;
    exclude?: string[];
    history?: boolean;
}

export class Compare {
    private options: CompareOptions;

    public static command = 'compare <fhir1_base> <fhir2_base>';
    public static description = 'Compare the resources from one FHIR server to another';

    public static args(yargs: Argv): Argv {
        return yargs
            .positional('fhir1_base', {
                type: 'string',
                describe: 'The FHIR server base of the first FHIR server'
            })
            .positional('fhir2_base', {
                type: 'string',
                describe: 'The FHIR server base of the second FHIR server'
            })
            .option('page_size', {
                alias: 's',
                type: 'number',
                describe: 'The size of results to return per page',
                default: 50
            })
            .option('exclude', {
                alias: 'e',
                array: true,
                type: 'string',
                description: 'Resource types that should be excluded from the export (ex: AuditEvent)'
            })
            .option('history', {
                alias: 'h',
                boolean: true,
                description: 'Indicates if _history should be included'
            });
    }

    public static handler(args: Arguments) {
        new Compare(<CompareOptions><any>args).execute()
            .then(() => process.exit(0));
    }

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
