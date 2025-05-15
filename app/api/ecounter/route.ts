import { NextRequest } from "next/server";
import { getAllEncounters } from "@/lib/fhir";

export async function GET(request: NextRequest) {
  try {
    const encounters = await getAllEncounters();
    return new Response(JSON.stringify(encounters), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
