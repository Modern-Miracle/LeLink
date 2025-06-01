import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const AZURE_FUNCTIONS_URL = process.env.AZURE_FUNCTIONS_URL || 'http://localhost:7071';
const BACKEND_URL = AZURE_FUNCTIONS_URL + '/api/symptom-assessment';

export async function POST(req: NextRequest) {
  try {
    // Validate user session
    const session = await getServerSession(authOptions);

    const { message, threadId, patientId } = await req.json();

    // Use session user ID if available, otherwise use provided patientId
    // This ensures we always have a valid patient identifier
    const validatedPatientId = session?.user?.id || patientId || `anonymous-${Date.now()}`;

    // Validate patient ID format
    if (!validatedPatientId || validatedPatientId.length < 3) {
      return new Response(
        JSON.stringify({
          error: 'Invalid patient identifier',
          details: 'A valid patient ID is required for triage assessment',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Call Azure Functions backend
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.AZURE_FUNCTIONS_API_KEY && {
          'x-api-key': process.env.AZURE_FUNCTIONS_API_KEY,
        }),
      },
      body: JSON.stringify({
        message,
        threadId: threadId || undefined,
        patientId: validatedPatientId,
        includeResources: true,
        // Add user context for better FHIR resources
        userContext: {
          email: session?.user?.email,
          name: session?.user?.name,
          isAuthenticated: !!session,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend responded with status: ${response.status} - ${errorText}`);
    }

    // Check if response is streaming
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/event-stream')) {
      // Return streaming response
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Return JSON response
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Triage API Error:', err);
    return new Response(
      JSON.stringify({
        error: err.message || 'Failed to process triage request',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
