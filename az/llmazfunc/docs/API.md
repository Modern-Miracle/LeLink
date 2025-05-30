# API Reference

## Base URL

```
http://localhost:7071/api
```

## Endpoints

### POST /symptomAssessmentBot

Medical triage assistant endpoint that processes patient messages and returns triage assessments.

#### Request

```http
POST /api/symptomAssessmentBot
Content-Type: application/json
```

##### Request Body

```json
{
  "message": "string (required)",
  "patientId": "string (required)",
  "threadId": "string (optional)"
}
```

##### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| message | string | Yes | Patient's message describing symptoms (max 1000 characters) |
| patientId | string | Yes | Unique identifier for the patient |
| threadId | string | No | Existing conversation thread ID for continuity |

#### Response

##### Success Response (200 OK)

```json
{
  "reply": "string",
  "threadId": "string",
  "patientId": "string",
  "sessionId": "string",
  "completionStatus": "string",
  "resources": {
    "RiskAssessment": {
      "resourceType": "RiskAssessment",
      "id": "string",
      "status": "string",
      "subject": {
        "reference": "string"
      },
      "prediction": [
        {
          "outcome": {
            "text": "string"
          },
          "qualitativeRisk": {
            "coding": [
              {
                "system": "string",
                "code": "string",
                "display": "string"
              }
            ]
          }
        }
      ]
    },
    "Observation": {
      "resourceType": "Observation",
      "id": "string",
      "status": "string",
      "code": {
        "coding": [
          {
            "system": "string",
            "code": "string",
            "display": "string"
          }
        ]
      },
      "subject": {
        "reference": "string"
      },
      "valueString": "string"
    }
  }
}
```

##### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| reply | string | Assistant's response message |
| threadId | string | Conversation thread ID (use for subsequent messages) |
| patientId | string | Echo of the patient ID from request |
| sessionId | string | Unique session identifier |
| completionStatus | string | Status of the assistant run |
| resources | object | FHIR resources generated (optional) |
| resources.RiskAssessment | object | FHIR RiskAssessment resource |
| resources.Observation | object | FHIR Observation resource |

##### Error Responses

###### 400 Bad Request

```json
{
  "error": "string",
  "code": "VALIDATION_ERROR | SAFETY_ERROR | FHIR_ERROR",
  "correlationId": "string"
}
```

###### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR",
  "correlationId": "string"
}
```

#### Examples

##### Initial Conversation

```bash
curl -X POST http://localhost:7071/api/symptomAssessmentBot \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have severe chest pain and shortness of breath",
    "patientId": "patient-123"
  }'
```

Response:
```json
{
  "reply": "I understand you're experiencing severe chest pain and shortness of breath. These symptoms require immediate attention. Can you tell me when the chest pain started and if it's getting worse?",
  "threadId": "thread_abc123",
  "patientId": "patient-123",
  "sessionId": "session-456",
  "completionStatus": "completed",
  "resources": {
    "RiskAssessment": {
      "resourceType": "RiskAssessment",
      "id": "risk-789",
      "status": "final",
      "subject": {
        "reference": "Patient/patient-123"
      },
      "prediction": [{
        "outcome": {
          "text": "High risk - requires immediate medical attention"
        },
        "qualitativeRisk": {
          "coding": [{
            "system": "http://terminology.hl7.org/CodeSystem/risk-probability",
            "code": "high",
            "display": "High Risk"
          }]
        }
      }]
    }
  }
}
```

##### Follow-up Message

```bash
curl -X POST http://localhost:7071/api/symptomAssessmentBot \
  -H "Content-Type: application/json" \
  -d '{
    "message": "The pain started 30 minutes ago and it'\''s getting worse",
    "patientId": "patient-123",
    "threadId": "thread_abc123"
  }'
```

#### Rate Limits

- Maximum message length: 1000 characters
- Maximum conversation turns: 50 per thread

#### Error Codes

| Code | Description |
|------|-------------|
| VALIDATION_ERROR | Invalid request parameters |
| SAFETY_ERROR | Message contains unsafe content |
| FHIR_ERROR | Error generating FHIR resources |
| INTERNAL_ERROR | Server-side error |

#### Headers

##### Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| Content-Type | Yes | Must be `application/json` |
| X-Session-ID | No | Optional session tracking |

##### Response Headers

| Header | Description |
|--------|-------------|
| X-Correlation-Id | Unique request identifier for debugging |
| Content-Type | Always `application/json` |

## Health Check

### GET /symptomAssessmentBot

Simple health check endpoint.

#### Request

```http
GET /api/symptomAssessmentBot
```

#### Response

```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```