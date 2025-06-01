# LeLink Backend - Crisis Medical Triage Azure Functions
# Optimized for crisis healthcare response

FROM mcr.microsoft.com/azure-functions/node:4-node20-appservice

# Set working directory
WORKDIR /home/site/wwwroot

# Create non-root user for security
RUN groupadd --gid 1001 azurefunc \
    && useradd --uid 1001 --gid azurefunc --shell /bin/bash --create-home azurefunc

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Copy configuration template
COPY config/local.settings.json.example config/local.settings.json.template

# Set proper ownership
RUN chown -R azurefunc:azurefunc /home/site/wwwroot

# Health check for crisis medical services
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost/api/symptomAssessmentBot -X POST \
        -H "Content-Type: application/json" \
        -d '{"message":"health check","threadId":null,"patientId":"health"}' || exit 1

# Environment variables for Azure Functions
ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true \
    FUNCTIONS_WORKER_RUNTIME=node \
    WEBSITE_NODE_DEFAULT_VERSION=~20 \
    NODE_ENV=production

# Labels for crisis healthcare context
LABEL org.opencontainers.image.title="LeLink Backend"
LABEL org.opencontainers.image.description="Crisis Medical Triage Azure Functions for emergency healthcare"
LABEL org.opencontainers.image.authors="Hora e.V. <info@hora-ev.eu>, Modern Miracle <hello@modern-miracle.com>, JurisCanada (Legal & Compliance)"
LABEL org.opencontainers.image.vendor="NGI Sargasso / EU Horizon Europe"
LABEL org.opencontainers.image.licenses="AGPL-3.0"
LABEL org.opencontainers.image.source="https://github.com/Modern-Miracle/LeLink"
LABEL crisis.healthcare="true"
LABEL ngi.sargasso="true"
LABEL medical.triage="true"
LABEL openai.integration="true"
LABEL fhir.compliant="true"

# Switch to non-root user
USER azurefunc

# Expose the default Azure Functions port
EXPOSE 80

# The Azure Functions runtime will start automatically