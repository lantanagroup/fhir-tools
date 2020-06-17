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
var urljoin = require("url-join");
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
            this.resourceTypes = ['Account', 'ActivityDefinition', 'AdverseEvent', 'AllergyIntolerance', 'Appointment', 'AppointmentResponse', 'AuditEvent', 'Basic', 'Binary', 'BiologicallyDerivedProduct', 'BodyStructure', 'Bundle', 'CapabilityStatement', 'CarePlan', 'CareTeam', 'CatalogEntry', 'ChargeItem', 'ChargeItemDefinition', 'Claim', 'ClaimResponse', 'ClinicalImpression', 'CodeSystem', 'Communication', 'CommunicationRequest', 'CompartmentDefinition', 'Composition', 'ConceptMap', 'Condition', 'Consent', 'Contract', 'Coverage', 'CoverageEligibilityRequest', 'CoverageEligibilityResponse', 'DetectedIssue', 'Device', 'DeviceDefinition', 'DeviceMetric', 'DeviceRequest', 'DeviceUseStatement', 'DiagnosticReport', 'DocumentManifest', 'DocumentReference', 'EffectEvidenceSynthesis', 'Encounter', 'Endpoint', 'EnrollmentRequest', 'EnrollmentResponse', 'EpisodeOfCare', 'EventDefinition', 'Evidence', 'EvidenceVariable', 'ExampleScenario', 'ExplanationOfBenefit', 'FamilyMemberHistory', 'Flag', 'Goal', 'GraphDefinition', 'Group', 'GuidanceResponse', 'HealthcareService', 'ImagingStudy', 'Immunization', 'ImmunizationEvaluation', 'ImmunizationRecommendation', 'ImplementationGuide', 'InsurancePlan', 'Invoice', 'Library', 'Linkage', 'List', 'Location', 'Measure', 'MeasureReport', 'Media', 'Medication', 'MedicationAdministration', 'MedicationDispense', 'MedicationKnowledge', 'MedicationRequest', 'MedicationStatement', 'MedicinalProduct', 'MedicinalProductAuthorization', 'MedicinalProductContraindication', 'MedicinalProductIndication', 'MedicinalProductIngredient', 'MedicinalProductInteraction', 'MedicinalProductManufactured', 'MedicinalProductPackaged', 'MedicinalProductPharmaceutical', 'MedicinalProductUndesirableEffect', 'MessageDefinition', 'MessageHeader', 'MolecularSequence', 'NamingSystem', 'NutritionOrder', 'Observation', 'ObservationDefinition', 'OperationDefinition', 'OperationOutcome', 'Organization', 'OrganizationAffiliation', 'Parameters', 'Patient', 'PaymentNotice', 'PaymentReconciliation', 'Person', 'PlanDefinition', 'Practitioner', 'PractitionerRole', 'Procedure', 'Provenance', 'Questionnaire', 'QuestionnaireResponse', 'RelatedPerson', 'RequestGroup', 'ResearchDefinition', 'ResearchElementDefinition', 'ResearchStudy', 'ResearchSubject', 'RiskAssessment', 'RiskEvidenceSynthesis', 'Schedule', 'SearchParameter', 'ServiceRequest', 'Slot', 'Specimen', 'SpecimenDefinition', 'StructureDefinition', 'StructureMap', 'Subscription', 'Substance', 'SubstancePolymer', 'SubstanceReferenceInformation', 'SubstanceSpecification', 'SupplyDelivery', 'SupplyRequest', 'Task', 'TerminologyCapabilities', 'TestReport', 'TestScript', 'ValueSet', 'VerificationResult', 'VisionPrescription'];
        }
        else {
            throw new Error('Invalid FHIR version ' + version);
        }
    }
    Export.prototype.getIgResources = function (resources) {
        return __awaiter(this, void 0, void 0, function () {
            var body;
            var _this = this;
            return __generator(this, function (_a) {
                body = {
                    resourceType: 'Bundle',
                    type: 'batch',
                    entry: resources.map(function (r) {
                        return {
                            request: {
                                method: 'GET',
                                url: r.reference
                            }
                        };
                    })
                };
                return [2, new Promise(function (resolve, reject) {
                        request(_this.fhirBase, { method: 'POST', json: true, body: body }, function (err, response, body) {
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
    Export.prototype.getResource = function (resourceType, id) {
        return __awaiter(this, void 0, void 0, function () {
            var url;
            return __generator(this, function (_a) {
                url = this.fhirBase;
                if (resourceType && id) {
                    url += (this.fhirBase.endsWith('/') ? '' : '/') + resourceType + '/' + id;
                }
                else if (resourceType) {
                    url += (this.fhirBase.endsWith('/') ? '' : '/') + resourceType;
                }
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
    Export.prototype.request = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2, new Promise(function (resolve, reject) {
                        var options = {
                            json: true,
                            headers: {
                                'Cache-Control': 'no-cache'
                            }
                        };
                        request(url, options, function (err, response, body) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                if (err) {
                                    return [2, reject(err)];
                                }
                                if (response.headers && response.headers['content-type'] && !response.headers['content-type'].startsWith('application/json') && !response.headers['content-type'].startsWith('application/fhir+json')) {
                                    console.error('Response from FHIR server is not JSON!');
                                    return [2, reject('Response from FHIR server is not JSON!')];
                                }
                                resolve(body);
                                return [2];
                            });
                        }); });
                    })];
            });
        });
    };
    Export.prototype.getBundle = function (nextUrl, resourceType) {
        return __awaiter(this, void 0, void 0, function () {
            var body, nextNextUrl;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.bundles[resourceType]) {
                            this.bundles[resourceType] = [];
                        }
                        console.log("Requesting " + nextUrl);
                        return [4, this.request(nextUrl)];
                    case 1:
                        body = _a.sent();
                        if (body.entry && body.entry.length > 0) {
                            console.log("Found " + body.entry.length + " " + resourceType + " entries in bundle (Bundle.total = " + body.total + ")");
                            this.bundles[resourceType].push(body);
                        }
                        else {
                            console.log("No entries found for " + resourceType);
                        }
                        nextNextUrl = (body.link || []).find(function (link) { return link.relation === 'next'; });
                        if (!(nextNextUrl && nextNextUrl.url)) return [3, 3];
                        return [4, this.getBundle(nextNextUrl.url, resourceType)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2];
                }
            });
        });
    };
    Export.prototype.processQueue = function () {
        return __awaiter(this, void 0, void 0, function () {
            var resourceType, nextUrl, totalEntries;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.resourceTypes.length === 0) {
                            return [2];
                        }
                        resourceType = this.resourceTypes.pop();
                        nextUrl = urljoin(this.fhirBase, resourceType);
                        nextUrl += '?_count=' + this.pageSize.toString();
                        console.log("----------------------------\r\nStarting retrieve for " + resourceType);
                        return [4, this.getBundle(nextUrl, resourceType)];
                    case 1:
                        _a.sent();
                        return [4, this.processQueue()];
                    case 2:
                        _a.sent();
                        if (this.bundles[resourceType] && this.bundles[resourceType].length > 0) {
                            totalEntries = this.bundles[resourceType]
                                .reduce(function (previous, current) {
                                for (var _i = 0, _a = current.entry || []; _i < _a.length; _i++) {
                                    var entry = _a[_i];
                                    previous.push(entry);
                                }
                                return previous;
                            }, [])
                                .length;
                            if (totalEntries !== this.bundles[resourceType][0].total) {
                                console.error("Expected " + this.bundles[resourceType][0].total + " but actually have " + totalEntries + " for " + resourceType);
                            }
                        }
                        return [2];
                }
            });
        });
    };
    Export.prototype.execute = function () {
        return __awaiter(this, void 0, void 0, function () {
            var transactionBundle, _i, _a, resourceType, bundles, _b, bundles_1, bundle, _c, _d, entry, igs, _loop_1, this_1, _e, igs_1, ig, fixIds, fixR4, fixUrls, fixSubscriptions, fixMedia;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0: return [4, this.processQueue()];
                    case 1:
                        _f.sent();
                        transactionBundle = {
                            resourceType: 'Bundle',
                            type: 'transaction',
                            total: 0,
                            entry: []
                        };
                        for (_i = 0, _a = Object.keys(this.bundles); _i < _a.length; _i++) {
                            resourceType = _a[_i];
                            bundles = this.bundles[resourceType];
                            for (_b = 0, bundles_1 = bundles; _b < bundles_1.length; _b++) {
                                bundle = bundles_1[_b];
                                for (_c = 0, _d = (bundle.entry || []); _c < _d.length; _c++) {
                                    entry = _d[_c];
                                    transactionBundle.entry.push({
                                        resource: entry.resource,
                                        request: {
                                            method: 'PUT',
                                            url: resourceType + "/" + entry.resource.id
                                        }
                                    });
                                    transactionBundle.total++;
                                }
                            }
                        }
                        igs = transactionBundle.entry
                            .filter(function (tbe) { return tbe.resource.resourceType === 'ImplementationGuide'; })
                            .map(function (tbe) { return tbe.resource; });
                        _loop_1 = function (ig) {
                            var igResourcesBundle, igResourceReferences, igResourceReferences_1, foundIgResources, missingIgResources;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        igResourcesBundle = void 0;
                                        console.log("Searching for missing resources for the IG " + ig.id);
                                        if (!(this_1.version === 'r4' && ig.definition && ig.definition.resource)) return [3, 2];
                                        igResourceReferences = ig.definition.resource
                                            .filter(function (r) { return r.reference && r.reference.reference; })
                                            .map(function (r) { return r.reference; });
                                        return [4, this_1.getIgResources(igResourceReferences)];
                                    case 1:
                                        igResourcesBundle = _a.sent();
                                        return [3, 4];
                                    case 2:
                                        if (!(this_1.version === 'dstu3')) return [3, 4];
                                        igResourceReferences_1 = [];
                                        (ig.package || []).forEach(function (p) {
                                            var nextResourceReferences = (p.resource || [])
                                                .filter(function (r) { return r.sourceReference && r.sourceReference.reference; })
                                                .map(function (r) { return r.sourceReference; });
                                            igResourceReferences_1 = igResourceReferences_1.concat(nextResourceReferences);
                                        });
                                        return [4, this_1.getIgResources(igResourceReferences_1)];
                                    case 3:
                                        igResourcesBundle = _a.sent();
                                        _a.label = 4;
                                    case 4:
                                        if (igResourcesBundle && igResourcesBundle.entry) {
                                            foundIgResources = igResourcesBundle.entry
                                                .filter(function (e) { return e.response && e.response.status === '200 OK'; })
                                                .map(function (e) { return e.resource; });
                                            missingIgResources = foundIgResources
                                                .filter(function (r) {
                                                return !transactionBundle.entry.find(function (tbe) {
                                                    return tbe.resource.resourceType === r.resourceType && tbe.resource.id === r.id;
                                                });
                                            })
                                                .map(function (e) {
                                                return {
                                                    request: {
                                                        method: 'PUT',
                                                        resource: e.resource
                                                    }
                                                };
                                            });
                                            if (missingIgResources.length > 0) {
                                                transactionBundle.entry = transactionBundle.entry.concat(missingIgResources);
                                                console.log("Adding " + missingIgResources.length + " resources not already in export for IG " + ig.id);
                                            }
                                        }
                                        return [2];
                                }
                            });
                        };
                        this_1 = this;
                        _e = 0, igs_1 = igs;
                        _f.label = 2;
                    case 2:
                        if (!(_e < igs_1.length)) return [3, 5];
                        ig = igs_1[_e];
                        return [5, _loop_1(ig)];
                    case 3:
                        _f.sent();
                        _f.label = 4;
                    case 4:
                        _e++;
                        return [3, 2];
                    case 5:
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