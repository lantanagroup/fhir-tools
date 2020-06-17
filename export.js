"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
        this.version = version;
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
    Export.prototype.getResource = function (resourceType, id) {
        return __awaiter(this, void 0, void 0, function () {
            var url;
            return __generator(this, function (_a) {
                url = this.fhirBase + (this.fhirBase.endsWith('/') ? '' : '/') + resourceType + '/' + id;
                return [2, new Promise(function (resolve, reject) {
                        request(url, { json: true }, function (err, response, body) {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(body);
                            }
                        });
                    })];
            });
        });
    };
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
        return __awaiter(this, void 0, void 0, function () {
            var transactionBundle, igResources, extraTransaction, _loop_1, this_1, _i, igResources_1, igResource, fixIds, fixR4, fixUrls, fixSubscriptions, fixMedia;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.processQueue()];
                    case 1:
                        _a.sent();
                        transactionBundle = {
                            resourceType: 'Bundle',
                            type: 'transaction',
                            total: 0,
                            entry: []
                        };
                        igResources = [];
                        _.each(this.bundles, function (bundles, resourceType) {
                            _.each(bundles, function (bundle) {
                                _.each(bundle.entry, function (entry) {
                                    if (entry.resource.resourceType === 'ImplementationGuide') {
                                        if (_this.version === 'r4' && entry.resource.definition && entry.resource.definition.resource) {
                                            var nextIgResources = entry.resource.definition.resource
                                                .filter(function (r) { return r.reference && r.reference.reference; })
                                                .map(function (r) { return r.reference.reference; });
                                            igResources = igResources.concat(nextIgResources);
                                        }
                                        else if (_this.version === 'dstu3') {
                                            (entry.resource.package || []).forEach(function (p) {
                                                var nextIgResources = (p.resource || [])
                                                    .filter(function (r) { return r.sourceReference && r.sourceReference.reference; })
                                                    .map(function (r) { return r.sourceReference.reference; });
                                                igResources = igResources.concat(nextIgResources);
                                            });
                                        }
                                    }
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
                        extraTransaction = {
                            total: 0,
                            entry: []
                        };
                        _loop_1 = function (igResource) {
                            var refSplit, foundInBundle, resource, entry, ex_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        refSplit = igResource.split('/');
                                        if (!(refSplit.length === 2)) return [3, 4];
                                        foundInBundle = transactionBundle.entry.find(function (e) { return e.resource && e.resource.resourceType === refSplit[0] && e.resource.id === refSplit[1]; });
                                        if (!!foundInBundle) return [3, 4];
                                        console.log('Attempting to retrieve implementation guide resource not found in returned bundle: ' + igResource);
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 3, , 4]);
                                        return [4, this_1.getResource(refSplit[0], refSplit[1])];
                                    case 2:
                                        resource = _a.sent();
                                        entry = {
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
                                        console.log("Added " + igResource + " to transaction bundle");
                                        return [3, 4];
                                    case 3:
                                        ex_1 = _a.sent();
                                        console.log("Error retrieving implementation guide resource " + igResource + ": " + ex_1.message);
                                        return [3, 4];
                                    case 4: return [2];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, igResources_1 = igResources;
                        _a.label = 2;
                    case 2:
                        if (!(_i < igResources_1.length)) return [3, 5];
                        igResource = igResources_1[_i];
                        return [5, _loop_1(igResource)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3, 2];
                    case 5:
                        if (extraTransaction.total > 0) {
                            fs.writeFileSync('extra.json', JSON.stringify(extraTransaction, null, '\t'));
                        }
                        console.log('Cleaning up the ids to make sure they can all be imported into a HAPI server');
                        fixIds = new fixids_1.FixIds(transactionBundle);
                        fixIds.fix();
                        if (this.version === 'r4') {
                            fixR4 = new fixR4_1.FixR4(transactionBundle);
                            fixR4.fix();
                        }
                        fixUrls = new fixUrls_1.FixUrls(transactionBundle);
                        fixUrls.execute();
                        fixSubscriptions = new fixSubscriptions_1.FixSubscriptions(transactionBundle);
                        fixSubscriptions.execute();
                        fixMedia = new fixMedia_1.FixMedia(transactionBundle);
                        fixMedia.execute();
                        console.log('Done cleaning ids... Saving results to ' + this.outFile);
                        fs.writeFileSync(this.outFile, JSON.stringify(transactionBundle));
                        console.log("Created file " + this.outFile + " with a Bundle of " + transactionBundle.total + " entries");
                        return [2];
                }
            });
        });
    };
    return Export;
}());
exports.Export = Export;
//# sourceMappingURL=export.js.map