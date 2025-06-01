import { NextRequest } from "next/server";
import { getAllObservations } from "@/lib/fhir";

export async function GET(request: NextRequest) {
  try {
    const observations = await getAllObservations();
    return new Response(JSON.stringify(observations), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}