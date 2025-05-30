import { NextRequest } from "next/server";
import { getAllPatients } from "@/lib/fhir";

export async function GET(request: NextRequest) {
  try {
    const patient = await getAllPatients();
    return new Response(JSON.stringify(patient), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
