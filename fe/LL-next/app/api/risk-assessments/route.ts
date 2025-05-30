import { NextRequest } from "next/server";
import { getAllRiskAssessments } from "@/lib/fhir";

export async function GET(request: NextRequest) {
  try {
    const riskAssessments = await getAllRiskAssessments();
    return new Response(JSON.stringify(riskAssessments), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}