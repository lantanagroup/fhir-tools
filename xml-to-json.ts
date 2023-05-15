import {Fhir} from "fhir/fhir";
import {Arguments, Argv} from "yargs";
import * as fs from "fs";
import {sep} from 'path';
import * as Prompt from 'prompt-sync';

export class XmlToJsonOptions {
    path: string[];
    overwrite = false;
}

export class XmlToJson {
    private readonly options: XmlToJsonOptions;
    private fhir = new Fhir();
    private prompt = Prompt({ sigint: true });

    public static command = 'xml-to-json';
    public static description = 'Converts a XML file (or all XML files in a directory) to JSON';

    public static args(args: Argv): Argv {
        return args
            .option('path', {
                type: 'string',
                description: 'The directories or files to convert to JSON',
                array: true
            })
            .option('overwrite', {
                type: 'boolean',
                description: 'Always overwrite destination, and do not prompt if the output path for each JSON file already exists',
                default: false
            });
    }

    public static handler(args: Arguments) {
        new XmlToJson(<XmlToJsonOptions><any>args).execute();
    }

    constructor(options: XmlToJsonOptions) {
        this.options = options;
    }

    convert(filePath: string) {
        if (!filePath || !filePath.toLowerCase().endsWith('.xml')) {
            return;
        }

        const xml = fs.readFileSync(filePath).toString();
        const json = this.fhir.xmlToJson(xml);

        const newFilePath = filePath.substring(0, filePath.lastIndexOf('.') + 1) + 'json';

        if (!fs.existsSync(newFilePath) || this.options.overwrite || this.prompt(`Overwrite ${newFilePath}? (y|N)`).trim().toLowerCase() === 'y') {
            fs.writeFileSync(newFilePath, json);
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