import * as request from 'request';
import * as urljoin from 'url-join';
import * as fs from 'fs';
import {FixIds} from './fixids';
import {FixR4} from './fixR4';
import {FixUrls} from "./fixUrls";
import {FixSubscriptions} from "./fixSubscriptions";
import {FixMedia} from "./fixMedia";
import {parseOperationOutcome} from "./helper";

export class Export {
    readonly fhirBase: string;
    private pageSize: number;
    private outFile: string;
    private resourceTypes: string[];
    private bundles: { [resourceType: string]: any[] } = {};
    private version: 'dstu3'|'r4';

    constructor(fhirBase: string, outFile: string, pageSize: number, version: 'dstu3'|'r4') {
        this.fhirBase = fhirBase;
        this.outFile = outFile;
        this.pageSize = pageSize;
        this.version = version;

        if (version === 'dstu3') {
            this.resourceTypes = ['Account', 'ActivityDefinition', 'AllergyIntolerance', 'AdverseEvent', 'Appointment', 'AppointmentResponse', 'AuditEvent', 'Basic', 'Binary', 'BodySite', 'Bundle', 'CapabilityStatement', 'CarePlan', 'CareTeam', 'ChargeItem', 'Claim', 'ClaimResponse', 'ClinicalImpression', 'CodeSystem', 'Communication', 'CommunicationRequest', 'CompartmentDefinition', 'Composition', 'ConceptMap', 'Condition', 'Consent', 'Contract', 'Coverage', 'DataElement', 'DetectedIssue', 'Device', 'DeviceComponent', 'DeviceMetric', 'DeviceRequest', 'DeviceUseStatement', 'DiagnosticReport', 'DocumentManifest', 'DocumentReference', 'EligibilityRequest', 'EligibilityResponse', 'Encounter', 'Endpoint', 'EnrollmentRequest', 'EnrollmentResponse', 'EpisodeOfCare', 'ExpansionProfile', 'ExplanationOfBenefit', 'FamilyMemberHistory', 'Flag', 'Goal', 'GraphDefinition', 'Group', 'GuidanceResponse', 'HealthcareService', 'ImagingManifest', 'ImagingStudy', 'Immunization', 'ImmunizationRecommendation', 'ImplementationGuide', 'Library', 'Linkage', 'List', 'Location', 'Measure', 'MeasureReport', 'Media', 'Medication', 'MedicationAdministration', 'MedicationDispense', 'MedicationRequest', 'MedicationStatement', 'MessageDefinition', 'MessageHeader', 'NamingSystem', 'NutritionOrder', 'Observation', 'OperationDefinition', 'OperationOutcome', 'Organization', 'Parameters', 'Patient', 'PaymentNotice', 'PaymentReconciliation', 'Person', 'PlanDefinition', 'Practitioner', 'PractitionerRole', 'Procedure', 'ProcedureRequest', 'ProcessRequest', 'ProcessResponse', 'Provenance', 'Questionnaire', 'QuestionnaireResponse', 'ReferralRequest', 'RelatedPerson', 'RequestGroup', 'ResearchStudy', 'ResearchSubject', 'RiskAssessment', 'Schedule', 'SearchParameter', 'Sequence', 'ServiceDefinition', 'Slot', 'Specimen', 'StructureDefinition', 'StructureMap', 'Subscription', 'Substance', 'SupplyDelivery', 'SupplyRequest', 'Task', 'TestScript', 'TestReport', 'ValueSet', 'VisionPrescription'];
        } else if (version === 'r4') {
            this.resourceTypes = ['Account', 'ActivityDefinition', 'AdverseEvent', 'AllergyIntolerance', 'Appointment', 'AppointmentResponse', 'AuditEvent', 'Basic', 'Binary', 'BiologicallyDerivedProduct', 'BodyStructure', 'Bundle', 'CapabilityStatement', 'CarePlan', 'CareTeam', 'CatalogEntry', 'ChargeItem', 'ChargeItemDefinition', 'Claim', 'ClaimResponse', 'ClinicalImpression', 'CodeSystem', 'Communication', 'CommunicationRequest', 'CompartmentDefinition', 'Composition', 'ConceptMap', 'Condition', 'Consent', 'Contract', 'Coverage', 'CoverageEligibilityRequest', 'CoverageEligibilityResponse', 'DetectedIssue', 'Device', 'DeviceDefinition', 'DeviceMetric', 'DeviceRequest', 'DeviceUseStatement', 'DiagnosticReport', 'DocumentManifest', 'DocumentReference', 'EffectEvidenceSynthesis', 'Encounter', 'Endpoint', 'EnrollmentRequest', 'EnrollmentResponse', 'EpisodeOfCare', 'EventDefinition', 'Evidence', 'EvidenceVariable', 'ExampleScenario', 'ExplanationOfBenefit', 'FamilyMemberHistory', 'Flag', 'Goal', 'GraphDefinition', 'Group', 'GuidanceResponse', 'HealthcareService', 'ImagingStudy', 'Immunization', 'ImmunizationEvaluation', 'ImmunizationRecommendation', 'ImplementationGuide', 'InsurancePlan', 'Invoice', 'Library', 'Linkage', 'List', 'Location', 'Measure', 'MeasureReport', 'Media', 'Medication', 'MedicationAdministration', 'MedicationDispense', 'MedicationKnowledge', 'MedicationRequest', 'MedicationStatement', 'MedicinalProduct', 'MedicinalProductAuthorization', 'MedicinalProductContraindication', 'MedicinalProductIndication', 'MedicinalProductIngredient', 'MedicinalProductInteraction', 'MedicinalProductManufactured', 'MedicinalProductPackaged', 'MedicinalProductPharmaceutical', 'MedicinalProductUndesirableEffect', 'MessageDefinition', 'MessageHeader', 'MolecularSequence', 'NamingSystem', 'NutritionOrder', 'Observation', 'ObservationDefinition', 'OperationDefinition', 'OperationOutcome', 'Organization', 'OrganizationAffiliation', 'Parameters', 'Patient', 'PaymentNotice', 'PaymentReconciliation', 'Person', 'PlanDefinition', 'Practitioner', 'PractitionerRole', 'Procedure', 'Provenance', 'Questionnaire', 'QuestionnaireResponse', 'RelatedPerson', 'RequestGroup', 'ResearchDefinition', 'ResearchElementDefinition', 'ResearchStudy', 'ResearchSubject', 'RiskAssessment', 'RiskEvidenceSynthesis', 'Schedule', 'SearchParameter', 'ServiceRequest', 'Slot', 'Specimen', 'SpecimenDefinition', 'StructureDefinition', 'StructureMap', 'Subscription', 'Substance', 'SubstancePolymer', 'SubstanceReferenceInformation', 'SubstanceSpecification', 'SupplyDelivery', 'SupplyRequest', 'Task', 'TerminologyCapabilities', 'TestReport', 'TestScript', 'ValueSet', 'VerificationResult', 'VisionPrescription'];
        } else {
            throw new Error('Invalid FHIR version ' + version);
        }
    }

    private async getIgResources(resources: any[]) {
        const body = {
            resourceType: 'Bundle',
            type: 'batch',
            entry: resources.map(r => {
                return {
                    request: {
                        method: 'GET',
                        url: r.reference
                    }
                }
            })
        };

        return new Promise((resolve, reject) => {
            request(this.fhirBase, { method: 'POST', json: true, body: body }, (err, response, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        });
    }

    private async getResource(resourceType?: string, id?: string) {
        let url = this.fhirBase;

        if (resourceType && id) {
            url += (this.fhirBase.endsWith('/') ? '' : '/') + resourceType + '/' + id;
        } else if (resourceType) {
            url += (this.fhirBase.endsWith('/') ? '' : '/') + resourceType;
        }

        return new Promise((resolve, reject) => {
            request(url, { json: true }, (err, response, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        });
    }

    private async request(url: string) {
        return new Promise((resolve, reject) => {
            const options = {
                json: true,
                headers: {
                    'Cache-Control': 'no-cache'
                }
            };

            request(url, options, async (err, response, body) => {
                if (err) {
                    return reject(err);
                }

                if (response.headers && response.headers['content-type'] && !response.headers['content-type'].startsWith('application/json') && !response.headers['content-type'].startsWith('application/fhir+json')) {
                    console.error('Response from FHIR server is not JSON!');
                    return reject('Response from FHIR server is not JSON!');
                }

                resolve(body);
            });
        });
    }

    private async getBundle(nextUrl: string, resourceType: string) {
        if (!this.bundles[resourceType]) {
            this.bundles[resourceType] = [];
        }

        console.log(`Requesting ${nextUrl}`);

        const body: any = await this.request(nextUrl);

        if (body.entry && body.entry.length > 0) {
            console.log(`Found ${body.entry.length} ${resourceType} entries in bundle (Bundle.total = ${body.total})`);
            this.bundles[resourceType].push(body);
        } else {
            console.log(`No entries found for ${resourceType}`);
        }

        const nextNextUrl = (body.link || []).find((link: any) => link.relation === 'next');

        if (nextNextUrl && nextNextUrl.url) {
            await this.getBundle(nextNextUrl.url, resourceType);
        }
    }

    private async processQueue() {
        if (this.resourceTypes.length === 0) {
            return;
        }

        const resourceType = this.resourceTypes.pop();
        let nextUrl = urljoin(this.fhirBase, resourceType);
        nextUrl += '?_count=' + this.pageSize.toString();

        console.log(`----------------------------\r\nStarting retrieve for ${resourceType}`);

        await this.getBundle(nextUrl, resourceType);
        await this.processQueue();

        if (this.bundles[resourceType] && this.bundles[resourceType].length > 0) {
            let totalEntries = this.bundles[resourceType]
                .reduce((previous, current) => {
                    for (let entry of current.entry || []) {
                        previous.push(entry);
                    }
                    return previous;
                }, [])
                .length;

            if (totalEntries !== this.bundles[resourceType][0].total) {
                console.error(`Expected ${this.bundles[resourceType][0].total} but actually have ${totalEntries} for ${resourceType}`);
            }
        }
    }

    public async execute() {
        await this.processQueue();

        const transactionBundle = {
            resourceType: 'Bundle',
            type: 'transaction',
            total: 0,
            entry: <any[]> []
        };

        for (let resourceType of Object.keys(this.bundles)) {
            const bundles = this.bundles[resourceType];

            for (let bundle of bundles) {
                for (let entry of (bundle.entry || [])) {
                    // Add the resource to the transaction bundle
                    transactionBundle.entry.push({
                        resource: entry.resource,
                        request: {
                            method: 'PUT',
                            url: `${resourceType}/${entry.resource.id}`
                        }
                    });
                    transactionBundle.total++;
                }
            }
        }

        const igs = transactionBundle.entry
            .filter(tbe => tbe.resource.resourceType === 'ImplementationGuide')
            .map(tbe => tbe.resource);

        // Ensure that all resources referenced by IGs are included in the export if they're on the server
        for (let ig of igs) {
            let igResourcesBundle: any;

            console.log(`Searching for missing resources for the IG ${ig.id}`);

            if (this.version === 'r4' && ig.definition && ig.definition.resource) {
                const igResourceReferences = ig.definition.resource
                    .filter((r: any) => r.reference && r.reference.reference)
                    .map((r: any) => r.reference);
                igResourcesBundle = await this.getIgResources(igResourceReferences);
            } else if (this.version === 'dstu3') {
                let igResourceReferences: any[] = [];
                (ig.package || []).forEach((p: any) => {
                    const nextResourceReferences = (p.resource || [])
                        .filter((r: any) => r.sourceReference && r.sourceReference.reference)
                        .map((r: any) => r.sourceReference);
                    igResourceReferences = igResourceReferences.concat(nextResourceReferences);
                });
                igResourcesBundle = await this.getIgResources(igResourceReferences);
            }

            if (igResourcesBundle && igResourcesBundle.entry) {
                const foundIgResources = igResourcesBundle.entry
                    .filter((e: any) => e.response && e.response.status === '200 OK')
                    .map((e: any) => e.resource);
                const missingIgResources = foundIgResources
                    .filter((r: any) => {
                        return !transactionBundle.entry.find(tbe => {
                            return tbe.resource.resourceType === r.resourceType && tbe.resource.id === r.id;
                        });
                    })
                    .map((e: any) => {
                        return {
                            request: {
                                method: 'PUT',
                                resource: e.resource
                            }
                        };
                    });

                if (missingIgResources.length > 0) {
                    transactionBundle.entry = transactionBundle.entry.concat(missingIgResources);
                    console.log(`Adding ${missingIgResources.length} resources not already in export for IG ${ig.id}`);
                }
            }
        }

        console.log('Cleaning up the ids to make sure they can all be imported into a HAPI server');

        const fixIds = new FixIds(transactionBundle);
        fixIds.fix();

        if (this.version === 'r4') {
            const fixR4 = new FixR4(transactionBundle);
            fixR4.fix();
        }

        const fixUrls = new FixUrls(transactionBundle);
        fixUrls.execute();

        const fixSubscriptions = new FixSubscriptions(transactionBundle);
        fixSubscriptions.execute();

        const fixMedia = new FixMedia(transactionBundle);
        fixMedia.execute();

        console.log('Done cleaning ids... Saving results to ' + this.outFile);

        fs.writeFileSync(this.outFile, JSON.stringify(transactionBundle));
        console.log(`Created file ${this.outFile} with a Bundle of ${transactionBundle.total} entries`);
    }
}