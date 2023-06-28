import {Fhir} from "fhir/fhir";
import {ParseConformance} from "fhir/parseConformance";
import * as fs from "fs";
import * as path from "path";

export function log(message: string, error = false) {
    const msg = (new Date().toISOString()) + ' - ' + message;
    const func = error ? console.error : console.log;
    func(msg);
}

export function getFhirInstance(version: 'dstu3'|'r4' = 'r4'): Fhir {
    let fhir: Fhir;

    if (version === 'dstu3') {
        const parser = new ParseConformance();

        const codeSystem3166 = JSON.parse(fs.readFileSync(path.join(__dirname, 'spec/stu3/codesystem-iso3166.json')).toString());
        const profilesResources = JSON.parse(fs.readFileSync(path.join(__dirname, 'spec/stu3/profiles-resources.json')).toString());
        const profilesTypes = JSON.parse(fs.readFileSync(path.join(__dirname, 'spec/stu3/profiles-types.json')).toString());
        const valueSets = JSON.parse(fs.readFileSync(path.join(__dirname, 'spec/stu3/valuesets.json')).toString());
        parser.loadCodeSystem(codeSystem3166);
        parser.parseBundle(profilesResources);
        parser.parseBundle(profilesTypes);
        parser.parseBundle(valueSets);

        fhir = new Fhir(parser);
    } else if (version === 'r4') {
        fhir = new Fhir();
    }

    return fhir;
}

export function parseOperationOutcome(oo: any): string {
    if (oo && oo.resourceType === 'OperationOutcome') {
        if (oo.issue && oo.issue.length > 0) {
            return '\r\n' + oo.issue.map((i: any) => '- ' + i.diagnostics).join('\r\n');
        } else if (oo.text && oo.text.div) {
            return '\r\n' + oo.text.div;
        }
    }

    return '';
}
