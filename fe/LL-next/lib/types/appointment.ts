import { Reference } from "react";
import { CodeableConcept, FhirResource } from "./fhir";

export interface Appointment extends FhirResource {
  resourceType: "Appointment";
  status:
    | "proposed"
    | "pending"
    | "booked"
    | "arrived"
    | "fulfilled"
    | "cancelled"
    | "noshow"
    | "entered-in-error"
    | "checked-in"
    | "waitlist";
  start?: string;
  end?: string;
  description?: string;
  participant?: AppointmentParticipant[];
  reasonCode?: CodeableConcept[];
  created?: string;
}

export interface AppointmentParticipant {
  type?: CodeableConcept[];
  actor?: Reference;
  required?: "required" | "optional" | "information-only";
  status: "accepted" | "declined" | "tentative" | "needs-action";
}
