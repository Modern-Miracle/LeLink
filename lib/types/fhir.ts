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
