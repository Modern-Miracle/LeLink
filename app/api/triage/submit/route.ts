import { NextRequest } from "next/server";
import { createPatient } from "@/lib/fhir";
import { sendToQueue } from "@/lib/serviceBus";
import { generateHash } from "@/lib/hash";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const fhirResource = await createPatient(body);
    const hash = generateHash(fhirResource);
    await sendToQueue({ hash, resourceId: fhirResource.id });

    return new Response(JSON.stringify({ id: fhirResource.id, hash }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
