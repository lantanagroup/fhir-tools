import {Fhir} from "fhir/fhir";
import {Arguments, Argv} from "yargs";
import * as fs from "fs";
import {sep} from 'path';
import * as Prompt from 'prompt-sync';

export class JsonToXmlOptions {
    path: string[];
    overwrite = false;
}

export class JsonToXml {

    private readonly options: JsonToXmlOptions;
    private fhir = new Fhir();
    private prompt = Prompt({ sigint: true });

    public static command = 'json-to-xml';
    public static description = 'Converts a JSON file (or all JSON files in a directory) to XML';

    public static args(args: Argv): Argv {
        return args
            .option('path', {
                type: 'string',
                description: 'The directories or files to convert to XML',
                array: true
            })
            .option('overwrite', {
                type: 'boolean',
                description: 'Always overwrite destination, and do not prompt if the output path for each XML file already exists',
                default: false
            });
    }

    public static handler(args: Arguments) {
        new JsonToXml(<JsonToXmlOptions><any>args).execute();
    }

    constructor(options: JsonToXmlOptions) {
        this.options = options;
    }

    convert(filePath: string) {
        if (!filePath || !filePath.toLowerCase().endsWith('.json')) {
            return;
        }

        const json = fs.readFileSync(filePath).toString();
        const xml = this.fhir.jsonToXml(json);

        const newFilePath = filePath.substring(0, filePath.lastIndexOf('.') + 1) + 'xml';

        if (!fs.existsSync(newFilePath) || this.options.overwrite || this.prompt(`Overwrite ${newFilePath}? (y|N)`).trim().toLowerCase() === 'y') {
            fs.writeFileSync(newFilePath, xml);
            console.log(`Saved ${newFilePath}`);
        }
    }

    execute() {
        if (!this.options || !this.options.path || this.options.path.length <= 0) {
            return;
        }

        this.options.path.forEach(path => {
            if (!fs.existsSync(path)) {
                return;
            }

            if (fs.lstatSync(path).isDirectory()) {
                fs.readdirSync(path)
                    .forEach(next => this.convert(path + sep + next));
            } else {
                this.convert(path);
            }
        });
    }
}