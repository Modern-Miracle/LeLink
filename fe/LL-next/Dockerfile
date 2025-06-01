# LeLink Frontend - Crisis Healthcare PWA
# Multi-stage build for optimized production image

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Copy environment example (will be overridden by environment variables)
COPY .env.example .env.local

# Build the application
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy built application with proper ownership
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set user
USER nextjs

# Health check for crisis healthcare availability
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Expose port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Labels for crisis healthcare context
LABEL org.opencontainers.image.title="LeLink Frontend"
LABEL org.opencontainers.image.description="Crisis Healthcare PWA for vulnerable populations"
LABEL org.opencontainers.image.authors="Hora e.V. <info@hora-ev.eu>, Modern Miracle <hello@modern-miracle.com>, JurisCanada (Legal & Compliance)"
LABEL org.opencontainers.image.vendor="NGI Sargasso / EU Horizon Europe"
LABEL org.opencontainers.image.licenses="AGPL-3.0"
LABEL org.opencontainers.image.source="https://github.com/Modern-Miracle/LeLink"
LABEL crisis.healthcare="true"
LABEL ngi.sargasso="true"

# Start the application
CMD ["node", "server.js"]