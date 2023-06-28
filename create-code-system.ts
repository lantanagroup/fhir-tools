import {Arguments, Argv} from "yargs";
import * as fs from 'fs';

export class CreateCodeSystemOptions {
    type: 'rxnorm'|'snomed';
    path: string;
    output: string;
    pretty = false;
}

interface CodeSystem {
    resourceType: 'CodeSystem';
    url: string;
    status: string;
    content: string;
    concept: CodeSystemConcept[];
}

interface CodeSystemConcept {
    code: string;
    display: string;
}

export class CreateCodeSystem {
    private options: CreateCodeSystemOptions;
    private content: string;
    private codeSystem: CodeSystem;

    public static command = 'codesystem <type> <path> <output>';
    public static description = 'Create a code system from a source file, such as RXNorm or SNOMED-CT. This command is VERY basic and does not currently account for many of the complexities of SNOMED and RXNORM code systems. This is only intended as a starting point and should not be used in production systems that require reliability.';

    public static args(yargs: Argv): Argv {
        return yargs
            .positional('type', {
                describe: 'Which code system is being created',
                choices: ['rxnorm', 'snomed']
            })
            .positional('path', {
                describe: 'The path to the source code system file to load and convert into a CodeSystem resource'
            })
            .positional('output', {
                describe: 'The output path where the JSON CodeSystem should be stored'
            })
            .option('pretty', {
                alias: 'p',
                type: 'boolean'
            });
    }

    public static handler(args: Arguments) {
        const codeSystemCreator = new CreateCodeSystem(<CreateCodeSystemOptions><any>args);
        codeSystemCreator.execute();
    }

    constructor(options: CreateCodeSystemOptions) {
        this.options = options;
    }

    private rxnorm() {
        const lines = this.content.replace('\r', '').split('\n');
        this.codeSystem = {
            resourceType: 'CodeSystem',
            url: 'http://www.nlm.nih.gov/research/umls/rxnorm',
            status: 'active',
            content: 'complete',
            concept: []
        };

        this.codeSystem.concept = lines.map(line => {
            const parts = line.split('|');
            return {
                code: parts[7],
                display: parts[14]
            };
        });
    }

    private snomed() {
        const lines = this.content.replace('\r', '').split('\n');
        this.codeSystem = {
            resourceType: 'CodeSystem',
            url: 'http://snomed.info/sct',
            status: 'active',
            content: 'complete',
            concept: []
        };

        this.codeSystem.concept = lines.map(line => {
            const parts = line.split('\t');
            return {
                code: parts[4],
                display: parts[7]
            };
        });
    }

    public execute() {
        this.content = fs.readFileSync(this.options.path).toString();

        switch (this.options.type) {
            case 'rxnorm':
                this.rxnorm();
                break;
            case 'snomed':
                this.snomed();
                break;
            default:
                throw new Error(`Type ${this.options.type} not supported`);
        }

        if (this.options.pretty) {
            fs.writeFileSync(this.options.output, JSON.stringify(this.codeSystem, null, '\t'));
        } else {
            fs.writeFileSync(this.options.output, JSON.stringify(this.codeSystem));
        }
    }
}