# LeLink - Complete Crisis Healthcare System
# Multi-service container for easy deployment
# 
# Organizations: Hora e.V. (hora-ev.eu) & Modern Miracle (modern-miracle.com)
# EU Funding: NGI Sargasso under Horizon Europe programme

FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    curl \
    bash \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files for all components
COPY package*.json ./
COPY fe/LL-next/package*.json ./fe/LL-next/
COPY sc/LeLink-SC/package*.json ./sc/LeLink-SC/
COPY az/llmazfunc/package*.json ./az/llmazfunc/

# Stage 1: Frontend Build
FROM base AS frontend-builder
WORKDIR /app/fe/LL-next

# Install frontend dependencies
COPY fe/LL-next/package*.json ./
RUN npm ci

# Copy frontend source
COPY fe/LL-next/ ./

# Build frontend
RUN npm run build

# Stage 2: Backend Build  
FROM base AS backend-builder
WORKDIR /app/az/llmazfunc

# Install backend dependencies
COPY az/llmazfunc/package*.json ./
RUN npm ci

# Copy backend source
COPY az/llmazfunc/ ./

# Stage 3: Smart Contract Build
FROM base AS contract-builder
WORKDIR /app/sc/LeLink-SC

# Install smart contract dependencies
COPY sc/LeLink-SC/package*.json ./
RUN npm ci

# Copy smart contract source
COPY sc/LeLink-SC/ ./

# Compile smart contracts
RUN npm run compile

# Stage 4: Final Runtime Image
FROM node:20-alpine AS runtime

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    bash \
    supervisor \
    nginx \
    && rm -rf /var/cache/apk/*

# Create application user
RUN addgroup --system --gid 1001 lelink \
    && adduser --system --uid 1001 --gid lelink lelink

# Set working directory
WORKDIR /app

# Copy built applications
COPY --from=frontend-builder --chown=lelink:lelink /app/fe/LL-next/.next ./frontend/.next
COPY --from=frontend-builder --chown=lelink:lelink /app/fe/LL-next/public ./frontend/public
COPY --from=frontend-builder --chown=lelink:lelink /app/fe/LL-next/package*.json ./frontend/

COPY --from=backend-builder --chown=lelink:lelink /app/az/llmazfunc ./backend/
COPY --from=contract-builder --chown=lelink:lelink /app/sc/LeLink-SC ./contracts/

# Install production dependencies
WORKDIR /app/frontend
RUN npm ci --only=production

WORKDIR /app/backend
RUN npm ci --only=production

WORKDIR /app/contracts
RUN npm ci --only=production

# Create supervisor configuration
COPY <<EOF /etc/supervisor/conf.d/lelink.conf
[supervisord]
nodaemon=true
user=root
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid

[program:frontend]
command=node server.js
directory=/app/frontend
user=lelink
autostart=true
autorestart=true
stdout_logfile=/var/log/supervisor/frontend.log
stderr_logfile=/var/log/supervisor/frontend_error.log
environment=NODE_ENV=production,PORT=3000

[program:backend]
command=func start --host 0.0.0.0 --port 7071
directory=/app/backend
user=lelink
autostart=true
autorestart=true
stdout_logfile=/var/log/supervisor/backend.log
stderr_logfile=/var/log/supervisor/backend_error.log

[program:blockchain]
command=npx hardhat node --hostname 0.0.0.0 --port 8545
directory=/app/contracts
user=lelink
autostart=true
autorestart=true
stdout_logfile=/var/log/supervisor/blockchain.log
stderr_logfile=/var/log/supervisor/blockchain_error.log
EOF

# Create nginx configuration for reverse proxy
COPY <<EOF /etc/nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Crisis Healthcare Frontend
    server {
        listen 80;
        server_name localhost;

        # Frontend (Next.js PWA)
        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
        }

        # Backend API (Azure Functions)
        location /api/ {
            proxy_pass http://localhost:7071/api/;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Blockchain RPC (for development)
        location /blockchain/ {
            proxy_pass http://localhost:8545/;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
EOF

# Create startup script
COPY <<EOF /app/start.sh
#!/bin/bash
set -e

echo "🆘 Starting LeLink Crisis Healthcare System..."
echo "🏛️ Organizations: Hora e.V. & Modern Miracle"
echo "🇪🇺 EU Funding: NGI Sargasso"

# Start nginx
nginx

# Start all services with supervisor
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/lelink.conf
EOF

RUN chmod +x /app/start.sh

# Health check for complete system
HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=5 \
    CMD curl -f http://localhost/ && \
        curl -f http://localhost/api/symptomAssessmentBot -X POST \
            -H "Content-Type: application/json" \
            -d '{"message":"health check","threadId":null,"patientId":"health"}' && \
        curl -f http://localhost/blockchain/ -X POST \
            -H "Content-Type: application/json" \
            -d '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}' || exit 1

# Expose ports
EXPOSE 80

# Environment variables
ENV NODE_ENV=production
ENV CRISIS_HEALTHCARE=true
ENV NGI_SARGASSO=true

# Labels for crisis healthcare context
LABEL org.opencontainers.image.title="LeLink Complete System"
LABEL org.opencontainers.image.description="Complete Crisis Healthcare Data Management System"
LABEL org.opencontainers.image.authors="Hora e.V. <info@hora-ev.eu>, Modern Miracle <hello@modern-miracle.com>, JurisCanada (Legal & Compliance)"
LABEL org.opencontainers.image.vendor="NGI Sargasso / EU Horizon Europe"
LABEL org.opencontainers.image.licenses="AGPL-3.0"
LABEL org.opencontainers.image.source="https://github.com/Modern-Miracle/LeLink"
LABEL crisis.healthcare="true"
LABEL ngi.sargasso="true"
LABEL complete.system="true"

# Switch to application user for security
USER lelink

# Start the complete system
CMD ["/app/start.sh"]