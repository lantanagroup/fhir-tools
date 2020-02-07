"use strict";
exports.__esModule = true;
var request = require("request");
var Q = require("q");
var urljoin = require("url-join");
var _ = require("underscore");
var fs = require("fs");
var fixids_1 = require("./fixids");
var fixR4_1 = require("./fixR4");
var fixUrls_1 = require("./fixUrls");
var fixSubscriptions_1 = require("./fixSubscriptions");
var fixMedia_1 = require("./fixMedia");
var Export = (function () {
    function Export(fhirBase, outFile, pageSize, version) {
        this.bundles = {};
        this.fhirBase = fhirBase;
        this.outFile = outFile;
        this.pageSize = pageSize;
        if (version === 'dstu3') {
            this.resourceTypes = ['Account', 'ActivityDefinition', 'AllergyIntolerance', 'AdverseEvent', 'Appointment', 'AppointmentResponse', 'AuditEvent', 'Basic', 'Binary', 'BodySite', 'Bundle', 'CapabilityStatement', 'CarePlan', 'CareTeam', 'ChargeItem', 'Claim', 'ClaimResponse', 'ClinicalImpression', 'CodeSystem', 'Communication', 'CommunicationRequest', 'CompartmentDefinition', 'Composition', 'ConceptMap', 'Condition', 'Consent', 'Contract', 'Coverage', 'DataElement', 'DetectedIssue', 'Device', 'DeviceComponent', 'DeviceMetric', 'DeviceRequest', 'DeviceUseStatement', 'DiagnosticReport', 'DocumentManifest', 'DocumentReference', 'EligibilityRequest', 'EligibilityResponse', 'Encounter', 'Endpoint', 'EnrollmentRequest', 'EnrollmentResponse', 'EpisodeOfCare', 'ExpansionProfile', 'ExplanationOfBenefit', 'FamilyMemberHistory', 'Flag', 'Goal', 'GraphDefinition', 'Group', 'GuidanceResponse', 'HealthcareService', 'ImagingManifest', 'ImagingStudy', 'Immunization', 'ImmunizationRecommendation', 'ImplementationGuide', 'Library', 'Linkage', 'List', 'Location', 'Measure', 'MeasureReport', 'Media', 'Medication', 'MedicationAdministration', 'MedicationDispense', 'MedicationRequest', 'MedicationStatement', 'MessageDefinition', 'MessageHeader', 'NamingSystem', 'NutritionOrder', 'Observation', 'OperationDefinition', 'OperationOutcome', 'Organization', 'Parameters', 'Patient', 'PaymentNotice', 'PaymentReconciliation', 'Person', 'PlanDefinition', 'Practitioner', 'PractitionerRole', 'Procedure', 'ProcedureRequest', 'ProcessRequest', 'ProcessResponse', 'Provenance', 'Questionnaire', 'QuestionnaireResponse', 'ReferralRequest', 'RelatedPerson', 'RequestGroup', 'ResearchStudy', 'ResearchSubject', 'RiskAssessment', 'Schedule', 'SearchParameter', 'Sequence', 'ServiceDefinition', 'Slot', 'Specimen', 'StructureDefinition', 'StructureMap', 'Subscription', 'Substance', 'SupplyDelivery', 'SupplyRequest', 'Task', 'TestScript', 'TestReport', 'ValueSet', 'VisionPrescription'];
        }
        else if (version === 'r4') {
            this.resourceTypes = ['Account', 'ActivityDefinition', 'AdverseEvent', 'AllergyIntolerance', 'Appointment', 'AppointmentResponse', 'AuditEvent', 'Basic', 'Binary', 'BiologicallyDerivedProduct', 'BodyStructure', 'Bundle', 'CapabilityStatement', 'CarePlan', 'CareTeam', 'CatalogEntry', 'ChargeItem', 'ChargeItemDefinition', 'Claim', 'ClaimResponse', 'ClinicalImpression', 'CodeSystem', 'Communication', 'CommunicationRequest', 'CompartmentDefinition', 'Composition', 'ConceptMap', 'Condition (aka Problem)', 'Consent', 'Contract', 'Coverage', 'CoverageEligibilityRequest', 'CoverageEligibilityResponse', 'DetectedIssue', 'Device', 'DeviceDefinition', 'DeviceMetric', 'DeviceRequest', 'DeviceUseStatement', 'DiagnosticReport', 'DocumentManifest', 'DocumentReference', 'EffectEvidenceSynthesis', 'Encounter', 'Endpoint', 'EnrollmentRequest', 'EnrollmentResponse', 'EpisodeOfCare', 'EventDefinition', 'Evidence', 'EvidenceVariable', 'ExampleScenario', 'ExplanationOfBenefit', 'FamilyMemberHistory', 'Flag', 'Goal', 'GraphDefinition', 'Group', 'GuidanceResponse', 'HealthcareService', 'ImagingStudy', 'Immunization', 'ImmunizationEvaluation', 'ImmunizationRecommendation', 'ImplementationGuide', 'InsurancePlan', 'Invoice', 'Library', 'Linkage', 'List', 'Location', 'Measure', 'MeasureReport', 'Media', 'Medication', 'MedicationAdministration', 'MedicationDispense', 'MedicationKnowledge', 'MedicationRequest', 'MedicationStatement', 'MedicinalProduct', 'MedicinalProductAuthorization', 'MedicinalProductContraindication', 'MedicinalProductIndication', 'MedicinalProductIngredient', 'MedicinalProductInteraction', 'MedicinalProductManufactured', 'MedicinalProductPackaged', 'MedicinalProductPharmaceutical', 'MedicinalProductUndesirableEffect', 'MessageDefinition', 'MessageHeader', 'MolecularSequence', 'NamingSystem', 'NutritionOrder', 'Observation', 'ObservationDefinition', 'OperationDefinition', 'OperationOutcome', 'Organization', 'OrganizationAffiliation', 'Parameters', 'Patient', 'PaymentNotice', 'PaymentReconciliation', 'Person', 'PlanDefinition', 'Practitioner', 'PractitionerRole', 'Procedure', 'Provenance', 'Questionnaire', 'QuestionnaireResponse', 'RelatedPerson', 'RequestGroup', 'ResearchDefinition', 'ResearchElementDefinition', 'ResearchStudy', 'ResearchSubject', 'RiskAssessment', 'RiskEvidenceSynthesis', 'Schedule', 'SearchParameter', 'ServiceRequest', 'Slot', 'Specimen', 'SpecimenDefinition', 'StructureDefinition', 'StructureMap', 'Subscription', 'Substance', 'SubstancePolymer', 'SubstanceReferenceInformation', 'SubstanceSpecification', 'SupplyDelivery', 'SupplyRequest', 'Task', 'TerminologyCapabilities', 'TestReport', 'TestScript', 'ValueSet', 'VerificationResult', 'VisionPrescription'];
        }
        else {
            throw new Error('Invalid FHIR version ' + version);
        }
    }
    Export.prototype.getBundle = function (nextUrl, resourceType) {
        var _this = this;
        var deferred = Q.defer();
        if (!this.bundles[resourceType]) {
            this.bundles[resourceType] = [];
        }
        console.log("Requesting " + nextUrl);
        var options = {
            json: true,
            headers: {
                'Cache-Control': 'no-cache'
            }
        };
        request(nextUrl, options, function (err, response, body) {
            if (err) {
                return deferred.reject(err);
            }
            if (body.total > 0) {
                console.log("Found " + body.total + " " + resourceType + " entries in bundle");
                _this.bundles[resourceType].push(body);
            }
            else {
                console.log("No entries found for " + resourceType);
            }
            var nextNextUrl = _.find(body.link, function (link) { return link.relation === 'next'; });
            if (nextNextUrl) {
                _this.getBundle(nextNextUrl.url, resourceType)
                    .then(function () { return deferred.resolve(); })["catch"](function (err) { return deferred.reject(err); });
            }
            else {
                deferred.resolve();
            }
        });
        return deferred.promise;
    };
    Export.prototype.processQueue = function () {
        var _this = this;
        if (this.resourceTypes.length === 0) {
            return Q.resolve();
        }
        var deferred = Q.defer();
        var resourceType = this.resourceTypes.pop();
        var nextUrl = urljoin(this.fhirBase, resourceType);
        nextUrl += '?_count=' + this.pageSize.toString();
        console.log("----------------------------\r\nStarting retrieve for " + resourceType);
        this.getBundle(nextUrl, resourceType)
            .then(function () {
            _this.processQueue()
                .then(function () {
                var totalEntries = 0;
                if (_this.bundles[resourceType].length > 0) {
                    _.each(_this.bundles[resourceType], function (bundle) {
                        totalEntries += (bundle.entry ? bundle.entry.length : 0);
                    });
                    if (totalEntries !== _this.bundles[resourceType][0].total) {
                        console.error("Expected " + _this.bundles[resourceType][0].total + " but actually have " + totalEntries + " for " + resourceType);
                    }
                }
                deferred.resolve();
            })["catch"](function (err) { return deferred.reject(err); });
        })["catch"](function (err) { return deferred.reject(err); });
        return deferred.promise;
    };
    Export.prototype.execute = function () {
        var _this = this;
        this.processQueue()
            .then(function () {
            var transactionBundle = {
                resourceType: 'Bundle',
                type: 'transaction',
                total: 0,
                entry: []
            };
            _.each(_this.bundles, function (bundles, resourceType) {
                _.each(bundles, function (bundle) {
                    _.each(bundle.entry, function (entry) {
                        transactionBundle.entry.push({
                            resource: entry.resource,
                            request: {
                                method: 'PUT',
                                url: resourceType + "/" + entry.resource.id
                            }
                        });
                        transactionBundle.total++;
                    });
                });
            });
            console.log('Cleaning up the ids to make sure they can all be imported into a HAPI server');
            var fixIds = new fixids_1.FixIds(transactionBundle);
            fixIds.fix();
            var fixR4 = new fixR4_1.FixR4(transactionBundle);
            fixR4.fix();
            var fixUrls = new fixUrls_1.FixUrls(transactionBundle);
            fixUrls.execute();
            var fixSubscriptions = new fixSubscriptions_1.FixSubscriptions(transactionBundle);
            fixSubscriptions.execute();
            var fixMedia = new fixMedia_1.FixMedia(transactionBundle);
            fixMedia.execute();
            console.log('Done cleaning ids... Saving results to ' + _this.outFile);
            fs.writeFileSync(_this.outFile, JSON.stringify(transactionBundle));
            console.log("Created file " + _this.outFile + " with a Bundle of " + transactionBundle.total + " entries");
        })["catch"](function (err) {
            console.error(err);
        });
    };
    return Export;
}());
exports.Export = Export;
//# sourceMappingURL=export.js.map