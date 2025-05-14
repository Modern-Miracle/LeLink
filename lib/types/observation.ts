import { CodeableConcept, FhirResource, Reference } from "./fhir";

export interface Observation extends FhirResource {
  resourceType: "Observation";
  status: "registered" | "preliminary" | "final" | "amended";
  category?: CodeableConcept[];
  code: CodeableConcept;
  subject?: Reference;
  encounter?: Reference;
  effectiveDateTime?: string;
  valueQuantity?: {
    value: number;
    unit?: string;
    system?: string;
    code?: string;
  };
  interpretation?: CodeableConcept[];
}
