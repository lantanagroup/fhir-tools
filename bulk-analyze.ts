import * as fs from "fs";
import * as path from "path";
import {Arguments, Argv} from "yargs";
import {BulkImportOptions} from "./bulk-import";

export interface BulkAnalyzeOptions {
    inputDir: string;
    outputDir: string;
}

export class BulkAnalyze {
    private options: BulkAnalyzeOptions;

    public static command = 'bulk-analyze <inputDir> <outputDir>';
    public static description = 'Analyze resources from bulk ndjson files in a directory';

    public static args(yargs: Argv): Argv {
        return yargs
            .positional('inputDir', {
                type: 'string',
                describe: 'Path to a directory where .ndjson files are stored'
            })
            .positional('outputDir', {
                type: 'string',
                describe: 'Path to where the output analysis TSV files shoudl be stored'
            });
    }

    public static handler(args: Arguments) {
        new BulkAnalyze(<BulkAnalyzeOptions><any>args).execute();
    }

    constructor(options: BulkAnalyzeOptions) {
        this.options = options;
    }

    public execute() {
        const files = fs.readdirSync(this.options.inputDir)
            .filter(f => f.toLowerCase().endsWith('.ndjson'));
        const resources: any[] = [];

        if (!fs.existsSync(this.options.outputDir)) {
            fs.mkdirSync(this.options.outputDir);
        }

        console.log('Reading resources from directory');

        files.forEach((f: string) => {
            const fileContent = fs.readFileSync(path.join(this.options.inputDir, f)).toString();
            const fileLines = fileContent.replace(/\r/g, '').split('\n').filter((fl: string) => !!fl);
            const fileResources = fileLines.map((fl: string) => JSON.parse(fl));
            resources.push(...fileResources);
        });

        const allConditions = resources
            .filter(r => r.resourceType === 'Condition' && r.code && r.code.coding && r.code.coding.length > 0);
        const conditions = allConditions
            .map(r => {
                return {
                    id: r.id,
                    code: r.code.coding[0].code,
                    system: r.code.coding[0].system,
                    display: r.code.coding[0].display || r.code.text,
                    patient: r.subject && r.subject.reference ? r.subject.reference.replace(/Patient\//g, '') : null,
                    encounter: r.encounter && r.encounter.reference ? r.encounter.reference.replace(/Encounter\//g, '') : null,
                    onset: r.onsetDateTime
                };
            });

        if (fs.existsSync(path.join(this.options.outputDir, 'conditions.tsv'))) {
            fs.unlinkSync(path.join(this.options.outputDir, 'conditions.tsv'));
        }

        conditions.forEach(condition => {
            fs.appendFileSync(path.join(this.options.outputDir, 'conditions.tsv'), `${condition.id}\t${condition.patient}\t${condition.onset}\t${condition.code}\t${condition.system}\t${condition.display}\t${condition.encounter}\n`);
        });

        const encounters = resources
            .filter(r => r.resourceType === 'Encounter')
            .map(encounter => {
                return {
                    id: encounter.id,
                    classCode: encounter.class.code,
                    classSystem: encounter.class.system,
                    typeCode: encounter.type[0].coding[0].code,
                    typeSystem: encounter.type[0].coding[0].system,
                    patient: encounter.subject && encounter.subject.reference ? encounter.subject.reference.replace(/Patient\//g, '') : null,
                    start: encounter.period ? encounter.period.start : '',
                    end: encounter.period ? encounter.period.end : ''
                };
            });

        if (fs.existsSync(path.join(this.options.outputDir, 'encounters.tsv'))) {
            fs.unlinkSync(path.join(this.options.outputDir, 'encounters.tsv'));
        }

        encounters.forEach(encounter => {
            fs.appendFileSync(path.join(this.options.outputDir, 'encounters.tsv'), `${encounter.id}\t${encounter.patient}\t${encounter.start}\t${encounter.end}\t${encounter.classCode}\t${encounter.classSystem}\t${encounter.typeCode}\t${encounter.typeSystem}\n`);
        });

        const medications = resources
            .filter(r => r.resourceType === 'MedicationStatement')
            .map(med => {
                return {
                    id: med.id,
                    code: med.medicationCodeableConcept ? med.medicationCodeableConcept.coding[0].code : '',
                    system: med.medicationCodeableConcept ? med.medicationCodeableConcept.coding[0].system : '',
                    display: med.medicationCodeableConcept ? med.medicationCodeableConcept.text : '',
                    patient: med.subject && med.subject.reference ? med.subject.reference.replace(/Patient\//g, '') : '',
                    encounter: med.context && med.context.reference ? med.context.reference.replace(/Encounter\//g, '') : '',
                    start: med.effectivePeriod ? med.effectivePeriod.start || '' : '',
                    end: med.effectivePeriod ? med.effectivePeriod.end || '' : ''
                };
            });

        if (fs.existsSync(path.join(this.options.outputDir, 'medications.tsv'))) {
            fs.unlinkSync(path.join(this.options.outputDir, 'medications.tsv'));
        }

        medications.forEach(med => {
            fs.appendFileSync(path.join(this.options.outputDir, 'medications.tsv'), `${med.id}\t${med.patient}\t${med.start}\t${med.end}\t${med.code}\t${med.system}\t${med.display}\n`);
        });

        const allPatients = resources.filter(r => r.resourceType === 'Patient');
        const patients = allPatients
            .map(patient => {
                const raceExt = patient.extension ? patient.extension.find((e: { url: string; }) => e.url === 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-race') : null;
                const ethnicityExt = patient.extension ? patient.extension.find((e: { url: string; }) => e.url === 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity') : null;
                return {
                    id: patient.id,
                    first: patient.name[0].given[0],
                    last: patient.name[0].family,
                    gender: patient.gender || '',
                    birth: patient.birthDate || '',
                    deceased: patient.deceasedDateTime || '',
                    married: patient.maritalStatus ? patient.maritalStatus.coding[0].code : ''
                };
            });

        if (fs.existsSync(path.join(this.options.outputDir, 'patients.tsv'))) {
            fs.unlinkSync(path.join(this.options.outputDir, 'patients.tsv'));
        }

        patients.forEach(patient => {
            fs.appendFileSync(path.join(this.options.outputDir, 'patients.tsv'), `${patient.id}\t${patient.first}\t${patient.last}\t${patient.gender}\t${patient.birth}\t${patient.deceased}\t${patient.married}\n`);
        });

        const observations = resources
            .filter(r => r.resourceType === 'Observation')
            .map(obs => {
                let value = '';
                let unit = '';
                let system = '';

                if (obs.hasOwnProperty('valueQuantity')) {
                    value = obs.valueQuantity.value;
                    unit = obs.valueQuantity.unit;
                    system = obs.valueQuantity.system;
                } else if (obs.hasOwnProperty('valueString')) {
                    value = obs.valueString;
                } else {
                    console.log('unexpected value for observation');
                }

                return {
                    id: obs.id,
                    patient: obs.subject && obs.subject.reference ? obs.subject.reference.replace(/Patient\//g, '') : '',
                    encounter: obs.encounter && obs.encounter.reference ? obs.encounter.reference.replace(/Encounter\//g, '') : '',
                    date: obs.effectiveDateTime || '',
                    code: obs.code.coding[0].code || '',
                    codeSystem: obs.code.coding[0].system || '',
                    display: obs.text || '',
                    value: value,
                    valueUnit: unit,
                    valueSystem: system
                };
            });

        if (fs.existsSync(path.join(this.options.outputDir, 'observations.tsv'))) {
            fs.unlinkSync(path.join(this.options.outputDir, 'observations.tsv'));
        }

        observations.forEach(obs => {
            fs.appendFileSync(path.join(this.options.outputDir, 'observations.tsv'), `${obs.id}\t${obs.patient}\t${obs.encounter}\t${obs.date}\t${obs.code}\t${obs.codeSystem}\t${obs.display}\t${obs.value}\t${obs.valueUnit}\t${obs.valueSystem}\n`);
        });

        console.log('Done analyzing bulk data directory');
    }
}
