import * as request from 'request';
import * as Q from 'q';
import * as urljoin from 'url-join';
import * as _ from 'underscore';
import * as fs from 'fs';
import {FixIds} from './fixids';
import {FixR4} from './fixR4';
import {FixUrls} from "./fixUrls";
import {FixSubscriptions} from "./fixSubscriptions";
import {FixMedia} from "./fixMedia";

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
            this.resourceTypes = ['Account', 'ActivityDefinition', 'AdverseEvent', 'AllergyIntolerance', 'Appointment', 'AppointmentResponse', 'AuditEvent', 'Basic', 'Binary', 'BiologicallyDerivedProduct', 'BodyStructure', 'Bundle', 'CapabilityStatement', 'CarePlan', 'CareTeam', 'CatalogEntry', 'ChargeItem', 'ChargeItemDefinition', 'Claim', 'ClaimResponse', 'ClinicalImpression', 'CodeSystem', 'Communication', 'CommunicationRequest', 'CompartmentDefinition', 'Composition', 'ConceptMap', 'Condition (aka Problem)', 'Consent', 'Contract', 'Coverage', 'CoverageEligibilityRequest', 'CoverageEligibilityResponse', 'DetectedIssue', 'Device', 'DeviceDefinition', 'DeviceMetric', 'DeviceRequest', 'DeviceUseStatement', 'DiagnosticReport', 'DocumentManifest', 'DocumentReference', 'EffectEvidenceSynthesis', 'Encounter', 'Endpoint', 'EnrollmentRequest', 'EnrollmentResponse', 'EpisodeOfCare', 'EventDefinition', 'Evidence', 'EvidenceVariable', 'ExampleScenario', 'ExplanationOfBenefit', 'FamilyMemberHistory', 'Flag', 'Goal', 'GraphDefinition', 'Group', 'GuidanceResponse', 'HealthcareService', 'ImagingStudy', 'Immunization', 'ImmunizationEvaluation', 'ImmunizationRecommendation', 'ImplementationGuide', 'InsurancePlan', 'Invoice', 'Library', 'Linkage', 'List', 'Location', 'Measure', 'MeasureReport', 'Media', 'Medication', 'MedicationAdministration', 'MedicationDispense', 'MedicationKnowledge', 'MedicationRequest', 'MedicationStatement', 'MedicinalProduct', 'MedicinalProductAuthorization', 'MedicinalProductContraindication', 'MedicinalProductIndication', 'MedicinalProductIngredient', 'MedicinalProductInteraction', 'MedicinalProductManufactured', 'MedicinalProductPackaged', 'MedicinalProductPharmaceutical', 'MedicinalProductUndesirableEffect', 'MessageDefinition', 'MessageHeader', 'MolecularSequence', 'NamingSystem', 'NutritionOrder', 'Observation', 'ObservationDefinition', 'OperationDefinition', 'OperationOutcome', 'Organization', 'OrganizationAffiliation', 'Parameters', 'Patient', 'PaymentNotice', 'PaymentReconciliation', 'Person', 'PlanDefinition', 'Practitioner', 'PractitionerRole', 'Procedure', 'Provenance', 'Questionnaire', 'QuestionnaireResponse', 'RelatedPerson', 'RequestGroup', 'ResearchDefinition', 'ResearchElementDefinition', 'ResearchStudy', 'ResearchSubject', 'RiskAssessment', 'RiskEvidenceSynthesis', 'Schedule', 'SearchParameter', 'ServiceRequest', 'Slot', 'Specimen', 'SpecimenDefinition', 'StructureDefinition', 'StructureMap', 'Subscription', 'Substance', 'SubstancePolymer', 'SubstanceReferenceInformation', 'SubstanceSpecification', 'SupplyDelivery', 'SupplyRequest', 'Task', 'TerminologyCapabilities', 'TestReport', 'TestScript', 'ValueSet', 'VerificationResult', 'VisionPrescription'];
        } else {
            throw new Error('Invalid FHIR version ' + version);
        }
    }

    private async getResource(resourceType: string, id: string) {
        const url = this.fhirBase + (this.fhirBase.endsWith('/') ? '' : '/') + resourceType + '/' + id;

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

    private getBundle(nextUrl: string, resourceType: string) {
        const deferred = Q.defer();

        if (!this.bundles[resourceType]) {
            this.bundles[resourceType] = [];
        }

        console.log(`Requesting ${nextUrl}`);

        const options = {
            json: true,
            headers: {
                'Cache-Control': 'no-cache'
            }
        };

        request(nextUrl, options, (err, response, body) => {
            if (err) {
                return deferred.reject(err);
            }

            if (body.total > 0) {
                console.log(`Found ${body.total} ${resourceType} entries in bundle`);
                this.bundles[resourceType].push(body);
            } else {
                console.log(`No entries found for ${resourceType}`);
            }

            const nextNextUrl = _.find(body.link, (link: any) => link.relation === 'next');

            if (nextNextUrl) {
                this.getBundle(nextNextUrl.url, resourceType)
                    .then(() => deferred.resolve())
                    .catch((err) => deferred.reject(err));
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;
    }

    private processQueue() {
        if (this.resourceTypes.length === 0) {
            return Q.resolve();
        }

        const deferred = Q.defer();
        const resourceType = this.resourceTypes.pop();
        let nextUrl = urljoin(this.fhirBase, resourceType);
        nextUrl += '?_count=' + this.pageSize.toString();

        console.log(`----------------------------\r\nStarting retrieve for ${resourceType}`);

        this.getBundle(nextUrl, resourceType)
            .then(() => {
                this.processQueue()
                    .then(() => {
                        let totalEntries = 0;

                        if (this.bundles[resourceType].length > 0) {
                            _.each(this.bundles[resourceType], (bundle: any) => {
                                totalEntries += (bundle.entry ? bundle.entry.length : 0);
                            });

                            if (totalEntries !== this.bundles[resourceType][0].total) {
                                console.error(`Expected ${this.bundles[resourceType][0].total} but actually have ${totalEntries} for ${resourceType}`);
                            }
                        }
                        deferred.resolve();
                    })
                    .catch((err) => deferred.reject(err));
            })
            .catch((err) => deferred.reject(err));

        return deferred.promise;
    }

    public async execute() {
        await this.processQueue();

        const transactionBundle = {
            resourceType: 'Bundle',
            type: 'transaction',
            total: 0,
            entry: <any[]> []
        };

        let igResources: any[] = [];

        _.each(this.bundles, (bundles: any, resourceType: string) => {
            _.each(bundles, (bundle: any) => {
                _.each(bundle.entry, (entry: any) => {
                    if (entry.resource.resourceType === 'ImplementationGuide') {
                        if (this.version === 'r4' && entry.resource.definition && entry.resource.definition.resource) {
                            const nextIgResources = entry.resource.definition.resource
                                .filter((r: any) => r.reference && r.reference.reference)
                                .map((r: any) => r.reference.reference);
                            igResources = igResources.concat(nextIgResources);
                        } else if (this.version === 'dstu3') {
                            (entry.resource.package || []).forEach((p: any) => {
                                const nextIgResources = (p.resource || [])
                                    .filter((r: any) => r.sourceReference && r.sourceReference.reference)
                                    .map((r: any) => r.sourceReference.reference);
                                igResources = igResources.concat(nextIgResources);
                            });
                        }
                    }

                    transactionBundle.entry.push({
                        resource: entry.resource,
                        request: {
                            method: 'PUT',
                            url: `${resourceType}/${entry.resource.id}`
                        }
                    });
                    transactionBundle.total++;
                });
            });
        });

        const extraTransaction = {
            total: 0,
            entry: <any> []
        };

        for (let igResource of igResources) {
            const refSplit = igResource.split('/');

            if (refSplit.length === 2) {
                const foundInBundle = transactionBundle.entry.find(e => e.resource && e.resource.resourceType === refSplit[0] && e.resource.id === refSplit[1]);

                if (!foundInBundle) {
                    console.log('Attempting to retrieve implementation guide resource not found in returned bundle: ' + igResource);

                    try {
                        const resource = await this.getResource(refSplit[0], refSplit[1]);
                        const entry = {
                            resource: resource,
                            request: {
                                method: 'PUT',
                                url: igResource
                            }
                        };

                        transactionBundle.entry.push(entry);
                        extraTransaction.entry.push(entry);
                        transactionBundle.total++;
                        extraTransaction.total++;

                        console.log(`Added ${igResource} to transaction bundle`);
                    } catch (ex) {
                        console.log(`Error retrieving implementation guide resource ${igResource}: ${ex.message}`);
                    }
                }
            }
        }

        if (extraTransaction.total > 0) {
            fs.writeFileSync('extra.json', JSON.stringify(extraTransaction, null, '\t'));
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