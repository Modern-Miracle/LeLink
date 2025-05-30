import { NextRequest } from "next/server";

const BACKEND_URL = process.env.AZURE_FUNCTIONS_URL + '/api/symptomAssessmentBot';

export async function POST(req: NextRequest) {
  try {
    const { message, threadId, patientId } = await req.json();
    
    // Call Azure Functions backend
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.AZURE_FUNCTIONS_API_KEY && {
          'x-api-key': process.env.AZURE_FUNCTIONS_API_KEY
        })
      },
      body: JSON.stringify({
        message,
        threadId: threadId || undefined,
        patientId: patientId || undefined,
        includeResources: true
      })
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    // Check if response is streaming
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/event-stream')) {
      // Return streaming response
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Return JSON response
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error('Triage API Error:', err);
    return new Response(JSON.stringify({ 
      error: err.message || 'Failed to process triage request',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
