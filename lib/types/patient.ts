import { Address, ContactPoint, FhirResource, HumanName } from "./fhir";

export interface Patient extends FhirResource {
  resourceType: "Patient";
  name?: HumanName[];
  gender?: "male" | "female" | "other" | "unknown";
  birthDate?: string;
  address?: Address[];
  telecom?: ContactPoint[];
  deceasedBoolean?: boolean;
  deceasedDateTime?: string;
  identifier?: {
    system?: string;
    value?: string;
  }[];
}
