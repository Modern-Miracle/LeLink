import { CodeableConcept, Coding, FhirResource, Reference } from "./fhir";

export interface Encounter extends FhirResource {
  resourceType: "Encounter";
  status:
    | "planned"
    | "arrived"
    | "triaged"
    | "in-progress"
    | "onleave"
    | "finished"
    | "cancelled";
  class?: Coding;
  type?: CodeableConcept[];
  subject?: Reference; // usually a reference to Patient
  period?: {
    start?: string;
    end?: string;
  };
  reasonCode?: CodeableConcept[];
  serviceProvider?: Reference;
}
