import { useFHIRApi } from '@/lib/fhir';
import { NextRequest } from 'next/server';

export async function GET(_req: NextRequest) {
  try {
    const observations = await useFHIRApi('GET', '/Observation');
    const diagnostics = await useFHIRApi('GET', '/DiagnosticReport');
    const medications = await useFHIRApi('GET', '/MedicationRequest');

    const allRecords = [
      ...(observations.entry || []).map((e: any) => ({
        type: 'lab',
        title: e.resource.code?.text || 'Lab Result',
        date: e.resource.effectiveDateTime || e.resource.issued,
        performer: e.resource.performer?.[0]?.display,
        resource: e.resource,
      })),
      ...(diagnostics.entry || []).map((e: any) => ({
        type: 'imaging',
        title: e.resource.code?.text || 'Diagnostic Report',
        date: e.resource.effectiveDateTime || e.resource.issued,
        performer: e.resource.performer?.[0]?.display,
        resource: e.resource,
      })),
      ...(medications.entry || []).map((e: any) => ({
        type: 'prescription',
        title: e.resource.medicationCodeableConcept?.text || 'Prescription',
        date: e.resource.authoredOn,
        performer: e.resource.requester?.display,
        resource: e.resource,
      })),
    ];

    return new Response(JSON.stringify(allRecords), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
