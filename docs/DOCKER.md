# LeLink Docker Documentation

## 🐳 **Complete Docker Guide for Crisis Healthcare System**

This document provides comprehensive Docker deployment guidance for the LeLink crisis healthcare data management system.

> **🇪🇺 EU Funded Project**: Supported by [NGI Sargasso](https://ngisargasso.eu/) under the EU Horizon Europe programme.
> 
> **🏛️ Organizations**: Developed by [Hora e.V.](https://hora-ev.eu) in collaboration with [Modern Miracle](https://modern-miracle.com) and [JurisCanada](https://www.linkedin.com/company/juriscanada/about/) (Legal & Compliance).

## 🎯 **Quick Start**

### **🚀 Fastest Deployment**
```bash
# Clone and start the complete system
git clone https://github.com/Modern-Miracle/LeLink.git
cd LeLink
docker-compose up -d

# Access the application
open http://localhost:3000
```

## 📋 **Available Docker Configurations**

### **1. Complete System (Single Container)**
**File**: `Dockerfile`
**Purpose**: All-in-one container for simple deployment

```bash
# Build
docker build -t lelink-complete .

# Run
docker run -p 80:80 \
  -e OPENAI_API_KEY=your-key \
  -e NEXTAUTH_SECRET=your-secret \
  lelink-complete
```

**Services Included**:
- Next.js Frontend (PWA)
- Azure Functions Backend
- Hardhat Blockchain
- Nginx Reverse Proxy

### **2. Multi-Service Production**
**File**: `docker-compose.yml`
**Purpose**: Scalable production deployment

```bash
docker-compose up -d
```

**Services**:
- `frontend` - Crisis Healthcare PWA (Port 3000)
- `backend` - Medical Triage API (Port 7071)
- `blockchain` - Hardhat Network (Port 8545)
- `azurite` - FHIR Storage (Port 10000)
- `database` - PostgreSQL (Port 5432)
- `redis` - Cache & Sessions (Port 6379)
- `prometheus` - Monitoring (Port 9090)
- `loki` - Log Management (Port 3100)

### **3. Development Environment**
**File**: `docker-compose.development.yml`
**Purpose**: Development with hot reload

```bash
docker-compose -f docker-compose.development.yml up -d
```

**Additional Services**:
- `mailcatcher` - Email Testing (Port 1080)
- `docs-dev` - Documentation Server (Port 8080)
- `hardhat-dev` - Smart Contract Tools

## 🔧 **Environment Configuration**

### **Required Environment Variables**

Create a `.env` file in the root directory:

```bash
# OpenAI Configuration (Required)
OPENAI_API_KEY=sk-proj-your-openai-key
OPENAI_CONVERSATION_ASSISTANT_ID=asst_your-assistant-id
OPENAI_ORGANIZATION_ID=org-your-organization-id

# Authentication (Required for frontend)
NEXTAUTH_SECRET=your-nextauth-secret-32-chars-min
AUTH_MICROSOFT_ENTRA_ID_ID=your-azure-app-id
AUTH_MICROSOFT_ENTRA_ID_SECRET=your-azure-app-secret
AUTH_MICROSOFT_ENTRA_ID_TENANT_ID=your-azure-tenant-id

# Database Configuration
DATABASE_PASSWORD=secure-database-password

# Blockchain (Auto-populated after first deployment)
LELINK_CONTRACT_ADDRESS=0x...

# Optional: Custom Configuration
NODE_ENV=production
CRISIS_MODE=enabled
ENABLE_MONITORING=true
```

### **Development Environment Variables**

```bash
# Development overrides
NODE_ENV=development
NEXT_PUBLIC_BACKEND_URL=http://localhost:7071
NEXTAUTH_URL=http://localhost:3000
FAST_REFRESH=true

# Debug settings
DEBUG=lelink:*
VERBOSE_LOGGING=true
```

## 🏗️ **Building Docker Images**

### **Automated Build Script**

Use the provided build script for consistent builds:

```bash
# Make script executable
chmod +x scripts/docker-build.sh

# Build all images
./scripts/docker-build.sh --all

# Build specific services
./scripts/docker-build.sh --frontend --backend

# Build with custom tag
./scripts/docker-build.sh --all --tag v1.0.0

# Build and push to registry
./scripts/docker-build.sh --all --push --registry your-registry.com/
```

### **Manual Builds**

#### **Frontend (Crisis Healthcare PWA)**
```bash
cd fe/LL-next
docker build -t lelink-frontend .
```

#### **Backend (Medical Triage Functions)**
```bash
cd az/llmazfunc
docker build -t lelink-backend .
```

#### **Complete System**
```bash
docker build -t lelink-complete .
```

## 🔄 **Service Management**

### **Starting Services**

```bash
# All services (production)
docker-compose up -d

# Development environment
docker-compose -f docker-compose.development.yml up -d

# Specific services only
docker-compose up -d frontend backend blockchain
```

### **Stopping Services**

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ Data loss)
docker-compose down -v

# Stop development environment
docker-compose -f docker-compose.development.yml down
```

### **Viewing Logs**

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Crisis healthcare specific logs
docker-compose logs -f frontend backend | grep -E "(CRISIS|EMERGENCY|TRIAGE)"
```

## 📊 **Monitoring & Health Checks**

### **Built-in Health Checks**

Each service includes health checks:

```bash
# Check service health
docker-compose ps

# View health check logs
docker inspect --format='{{.State.Health}}' lelink-frontend
```

### **Monitoring Stack**

The production environment includes:

- **Prometheus** (Port 9090) - Metrics collection
- **Loki** (Port 3100) - Log aggregation
- **Built-in health endpoints** - Service status

```bash
# Access monitoring
open http://localhost:9090  # Prometheus
open http://localhost:3100  # Loki
```

## 🔒 **Security Considerations**

### **Production Security**

```bash
# Use non-root users (implemented in Dockerfiles)
# Enable security scanning
docker scan lelink-complete

# Use secrets management
docker secret create openai_key /path/to/openai_key.txt
```

### **Network Security**

```bash
# Custom network for isolation
docker network create lelink-secure-network

# Run with custom network
docker-compose --project-name lelink-secure up -d
```

### **Healthcare Data Protection**

- All containers run as non-root users
- HIPAA/GDPR compliance built-in
- No patient data in container logs
- Encrypted communication between services

## 🚀 **Deployment Strategies**

### **Development Deployment**

```bash
# Quick development setup
docker-compose -f docker-compose.development.yml up -d

# Access services
open http://localhost:3000   # Frontend
open http://localhost:7071   # Backend API
open http://localhost:1080   # Mail testing
open http://localhost:8080   # Documentation
```

### **Production Deployment**

```bash
# Production with monitoring
docker-compose up -d

# Scale services for high load
docker-compose up -d --scale frontend=3 --scale backend=2
```

### **Cloud Deployment**

#### **AWS ECS**
```bash
# Convert to ECS task definition
ecs-cli compose --project-name lelink service up
```

#### **Kubernetes**
```bash
# Generate Kubernetes manifests
kompose convert
kubectl apply -f .
```

#### **Azure Container Instances**
```bash
# Deploy to Azure
az container create --resource-group lelink-rg \
  --file docker-compose.yml
```

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Port Conflicts**
```bash
# Check port usage
netstat -tulpn | grep :3000

# Use different ports
FRONTEND_PORT=3001 docker-compose up -d
```

#### **Memory Issues**
```bash
# Increase Docker memory limit
# Docker Desktop: Settings → Resources → Memory → 8GB+

# Monitor container memory
docker stats
```

#### **OpenAI API Issues**
```bash
# Test API key
docker run --rm -e OPENAI_API_KEY=your-key lelink-backend \
  curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

#### **Blockchain Connection**
```bash
# Check blockchain status
curl -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}' \
  http://localhost:8545
```

### **Debug Mode**

```bash
# Enable verbose logging
DEBUG=* docker-compose up

# Access container shells
docker exec -it lelink-frontend sh
docker exec -it lelink-backend bash
```

### **Data Recovery**

```bash
# Backup volumes
docker run --rm -v lelink_azurite-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/fhir-backup.tar.gz /data

# Restore volumes
docker run --rm -v lelink_azurite-data:/data -v $(pwd):/backup alpine \
  tar xzf /backup/fhir-backup.tar.gz -C /
```

## 📋 **Maintenance**

### **Updates**

```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose up -d

# Clean up old images
docker image prune -a
```

### **Backup Strategy**

```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker run --rm \
  -v lelink_postgres-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/db_backup_$DATE.tar.gz /data
```

## 🎯 **Performance Optimization**

### **Resource Limits**

Add to `docker-compose.yml`:

```yaml
services:
  frontend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

### **Caching**

```bash
# Enable Docker BuildKit for faster builds
export DOCKER_BUILDKIT=1

# Use multi-stage builds (already implemented)
# Cache node_modules between builds
```

## 📞 **Support**

### **Organizations**
- **Hora e.V.**: [info@hora-ev.eu](mailto:info@hora-ev.eu)
- **Modern Miracle**: [hello@modern-miracle.com](mailto:hello@modern-miracle.com)
- **JurisCanada** (Legal & Compliance): [LinkedIn](https://www.linkedin.com/company/juriscanada/about/)

### **Community**
- GitHub Issues: Report Docker-specific problems
- Documentation: [LeLink Documentation](../README.md)

---

**🆘 Crisis Healthcare Ready**: This Docker configuration is optimized for rapid deployment during crisis situations, ensuring healthcare services remain available when needed most.

**🇪🇺 EU Compliance**: All containers meet European data protection and healthcare regulation standards.