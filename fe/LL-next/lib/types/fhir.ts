export interface FhirResource {
  resourceType: string;
  id?: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
  };
}

export interface HumanName {
  use?:
    | "usual"
    | "official"
    | "temp"
    | "nickname"
    | "anonymous"
    | "old"
    | "maiden";
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
  text?: string;
}

export interface Address {
  use?: "home" | "work" | "temp" | "old" | "billing";
  type?: "postal" | "physical" | "both";
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface ContactPoint {
  system: "phone" | "fax" | "email" | "pager" | "url" | "sms" | "other";
  value: string;
  use?: "home" | "work" | "temp" | "old" | "mobile";
  rank?: number;
}

export interface Coding {
  system?: string;
  code?: string;
  display?: string;
}

export interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

export interface Reference {
  reference?: string;
  type?: string;
  identifier?: { system?: string; value?: string };
  display?: string;
}

export interface Quantity {
  value?: number;
  comparator?: '<' | '<=' | '>=' | '>';
  unit?: string;
  system?: string;
  code?: string;
}

export interface Period {
  start?: string;
  end?: string;
}

export interface Annotation {
  authorReference?: Reference;
  authorString?: string;
  time?: string;
  text: string;
}

// FHIR R4 Observation Resource
export interface Observation extends FhirResource {
  resourceType: 'Observation';
  identifier?: Array<{
    system?: string;
    value?: string;
  }>;
  basedOn?: Reference[];
  partOf?: Reference[];
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown';
  category?: CodeableConcept[];
  code: CodeableConcept;
  subject?: Reference;
  focus?: Reference[];
  encounter?: Reference;
  effectiveDateTime?: string;
  effectivePeriod?: Period;
  effectiveTiming?: any;
  effectiveInstant?: string;
  issued?: string;
  performer?: Reference[];
  valueQuantity?: Quantity;
  valueCodeableConcept?: CodeableConcept;
  valueString?: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueRange?: {
    low?: Quantity;
    high?: Quantity;
  };
  valueRatio?: {
    numerator?: Quantity;
    denominator?: Quantity;
  };
  valueSampledData?: any;
  valueTime?: string;
  valueDateTime?: string;
  valuePeriod?: Period;
  dataAbsentReason?: CodeableConcept;
  interpretation?: CodeableConcept[];
  note?: Annotation[];
  bodySite?: CodeableConcept;
  method?: CodeableConcept;
  specimen?: Reference;
  device?: Reference;
  referenceRange?: Array<{
    low?: Quantity;
    high?: Quantity;
    type?: CodeableConcept;
    appliesTo?: CodeableConcept[];
    age?: {
      low?: Quantity;
      high?: Quantity;
    };
    text?: string;
  }>;
  hasMember?: Reference[];
  derivedFrom?: Reference[];
  component?: Array<{
    code: CodeableConcept;
    valueQuantity?: Quantity;
    valueCodeableConcept?: CodeableConcept;
    valueString?: string;
    valueBoolean?: boolean;
    valueInteger?: number;
    valueRange?: any;
    valueRatio?: any;
    valueSampledData?: any;
    valueTime?: string;
    valueDateTime?: string;
    valuePeriod?: Period;
    dataAbsentReason?: CodeableConcept;
    interpretation?: CodeableConcept[];
    referenceRange?: any[];
  }>;
}

// FHIR R4 RiskAssessment Resource
export interface RiskAssessment extends FhirResource {
  resourceType: 'RiskAssessment';
  identifier?: Array<{
    system?: string;
    value?: string;
  }>;
  basedOn?: Reference;
  parent?: Reference;
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown';
  method?: CodeableConcept;
  code?: CodeableConcept;
  subject: Reference;
  encounter?: Reference;
  occurrenceDateTime?: string;
  occurrencePeriod?: Period;
  condition?: Reference;
  performer?: Reference;
  reasonCode?: CodeableConcept[];
  reasonReference?: Reference[];
  basis?: Reference[];
  prediction?: Array<{
    outcome?: CodeableConcept;
    probabilityDecimal?: number;
    probabilityRange?: {
      low?: Quantity;
      high?: Quantity;
    };
    qualitativeRisk?: CodeableConcept;
    relativeRisk?: number;
    whenPeriod?: Period;
    whenRange?: {
      low?: Quantity;
      high?: Quantity;
    };
    rationale?: string;
  }>;
  mitigation?: string;
  note?: Annotation[];
}

// FHIR R4 Condition Resource
export interface Condition extends FhirResource {
  resourceType: 'Condition';
  identifier?: Array<{
    system?: string;
    value?: string;
  }>;
  clinicalStatus?: CodeableConcept;
  verificationStatus?: CodeableConcept;
  category?: CodeableConcept[];
  severity?: CodeableConcept;
  code?: CodeableConcept;
  bodySite?: CodeableConcept[];
  subject: Reference;
  encounter?: Reference;
  onsetDateTime?: string;
  onsetAge?: Quantity;
  onsetPeriod?: Period;
  onsetRange?: any;
  onsetString?: string;
  abatementDateTime?: string;
  abatementAge?: Quantity;
  abatementPeriod?: Period;
  abatementRange?: any;
  abatementString?: string;
  recordedDate?: string;
  recorder?: Reference;
  asserter?: Reference;
  stage?: Array<{
    summary?: CodeableConcept;
    assessment?: Reference[];
    type?: CodeableConcept;
  }>;
  evidence?: Array<{
    code?: CodeableConcept[];
    detail?: Reference[];
  }>;
  note?: Annotation[];
}

// Helper type for any FHIR resource
export type AnyFhirResource = FhirResource | Observation | RiskAssessment | Condition;
