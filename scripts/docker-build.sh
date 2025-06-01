#!/bin/bash

# LeLink Docker Build Script
# Crisis Healthcare System Build Automation
# 
# Organizations: Hora e.V. (hora-ev.eu) & Modern Miracle (modern-miracle.com)
# EU Funding: NGI Sargasso under Horizon Europe programme

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
DOCKER_REGISTRY=${DOCKER_REGISTRY:-""}
IMAGE_TAG=${IMAGE_TAG:-"latest"}
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

echo -e "${BLUE}🆘 LeLink Crisis Healthcare System - Docker Build${NC}"
echo -e "${BLUE}🏛️ Organizations: Hora e.V., Modern Miracle & JurisCanada${NC}"
echo -e "${BLUE}🇪🇺 EU Funding: NGI Sargasso${NC}"
echo ""

# Function to build individual service
build_service() {
    local service_name=$1
    local dockerfile_path=$2
    local context_path=$3
    local image_name="${DOCKER_REGISTRY}lelink-${service_name}:${IMAGE_TAG}"
    
    echo -e "${YELLOW}📦 Building ${service_name}...${NC}"
    
    docker build \
        --file "${dockerfile_path}" \
        --tag "${image_name}" \
        --build-arg BUILD_DATE="${BUILD_DATE}" \
        --build-arg GIT_COMMIT="${GIT_COMMIT}" \
        --build-arg VERSION="${IMAGE_TAG}" \
        --label "org.opencontainers.image.created=${BUILD_DATE}" \
        --label "org.opencontainers.image.revision=${GIT_COMMIT}" \
        --label "org.opencontainers.image.version=${IMAGE_TAG}" \
        --label "crisis.healthcare=true" \
        --label "ngi.sargasso=true" \
        "${context_path}"
    
    echo -e "${GREEN}✅ ${service_name} built successfully: ${image_name}${NC}"
}

# Function to build complete system
build_complete_system() {
    local image_name="${DOCKER_REGISTRY}lelink-complete:${IMAGE_TAG}"
    
    echo -e "${YELLOW}🏗️ Building complete crisis healthcare system...${NC}"
    
    docker build \
        --file "Dockerfile" \
        --tag "${image_name}" \
        --build-arg BUILD_DATE="${BUILD_DATE}" \
        --build-arg GIT_COMMIT="${GIT_COMMIT}" \
        --build-arg VERSION="${IMAGE_TAG}" \
        --label "org.opencontainers.image.created=${BUILD_DATE}" \
        --label "org.opencontainers.image.revision=${GIT_COMMIT}" \
        --label "org.opencontainers.image.version=${IMAGE_TAG}" \
        --label "crisis.healthcare=true" \
        --label "ngi.sargasso=true" \
        --label "complete.system=true" \
        "."
    
    echo -e "${GREEN}✅ Complete system built successfully: ${image_name}${NC}"
}

# Parse command line arguments
BUILD_FRONTEND=false
BUILD_BACKEND=false
BUILD_COMPLETE=false
BUILD_ALL=false
PUSH_IMAGES=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --frontend)
            BUILD_FRONTEND=true
            shift
            ;;
        --backend)
            BUILD_BACKEND=true
            shift
            ;;
        --complete)
            BUILD_COMPLETE=true
            shift
            ;;
        --all)
            BUILD_ALL=true
            shift
            ;;
        --push)
            PUSH_IMAGES=true
            shift
            ;;
        --tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        --registry)
            DOCKER_REGISTRY="$2"
            if [[ ! "$DOCKER_REGISTRY" =~ /$ ]]; then
                DOCKER_REGISTRY="${DOCKER_REGISTRY}/"
            fi
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --frontend          Build frontend image only"
            echo "  --backend           Build backend image only"
            echo "  --complete          Build complete system image"
            echo "  --all               Build all images"
            echo "  --push              Push images to registry after building"
            echo "  --tag TAG           Docker image tag (default: latest)"
            echo "  --registry URL      Docker registry URL"
            echo "  --help              Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --all                           # Build all images"
            echo "  $0 --frontend --backend           # Build specific services"
            echo "  $0 --complete --tag v1.0.0       # Build complete system with tag"
            echo "  $0 --all --push --registry repo/  # Build and push all images"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Default to building all if no specific options
if [[ "$BUILD_FRONTEND" == false && "$BUILD_BACKEND" == false && "$BUILD_COMPLETE" == false ]]; then
    BUILD_ALL=true
fi

# Check Docker availability
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed or not in PATH${NC}"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker daemon is not running${NC}"
    exit 1
fi

echo -e "${BLUE}🔧 Build Configuration:${NC}"
echo -e "  Registry: ${DOCKER_REGISTRY:-"(local)"}"
echo -e "  Tag: ${IMAGE_TAG}"
echo -e "  Git Commit: ${GIT_COMMIT}"
echo -e "  Build Date: ${BUILD_DATE}"
echo ""

# Build images based on options
if [[ "$BUILD_ALL" == true || "$BUILD_FRONTEND" == true ]]; then
    build_service "frontend" "fe/LL-next/Dockerfile" "fe/LL-next"
fi

if [[ "$BUILD_ALL" == true || "$BUILD_BACKEND" == true ]]; then
    build_service "backend" "az/llmazfunc/Dockerfile" "az/llmazfunc"
fi

if [[ "$BUILD_ALL" == true || "$BUILD_COMPLETE" == true ]]; then
    build_complete_system
fi

# Push images if requested
if [[ "$PUSH_IMAGES" == true ]]; then
    echo -e "${YELLOW}📤 Pushing images to registry...${NC}"
    
    if [[ -z "$DOCKER_REGISTRY" ]]; then
        echo -e "${RED}❌ Registry URL required for push operation${NC}"
        exit 1
    fi
    
    # Push built images
    if [[ "$BUILD_ALL" == true || "$BUILD_FRONTEND" == true ]]; then
        echo -e "${BLUE}Pushing frontend image...${NC}"
        docker push "${DOCKER_REGISTRY}lelink-frontend:${IMAGE_TAG}"
    fi
    
    if [[ "$BUILD_ALL" == true || "$BUILD_BACKEND" == true ]]; then
        echo -e "${BLUE}Pushing backend image...${NC}"
        docker push "${DOCKER_REGISTRY}lelink-backend:${IMAGE_TAG}"
    fi
    
    if [[ "$BUILD_ALL" == true || "$BUILD_COMPLETE" == true ]]; then
        echo -e "${BLUE}Pushing complete system image...${NC}"
        docker push "${DOCKER_REGISTRY}lelink-complete:${IMAGE_TAG}"
    fi
    
    echo -e "${GREEN}✅ Images pushed successfully${NC}"
fi

# Display built images
echo ""
echo -e "${GREEN}🎉 Build completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Built Images:${NC}"
docker images --filter "reference=*lelink*:${IMAGE_TAG}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

echo ""
echo -e "${PURPLE}🚀 Quick Start Commands:${NC}"
echo -e "${PURPLE}  Development: docker-compose -f docker-compose.development.yml up${NC}"
echo -e "${PURPLE}  Production:  docker-compose up${NC}"
echo -e "${PURPLE}  Complete:    docker run -p 80:80 ${DOCKER_REGISTRY}lelink-complete:${IMAGE_TAG}${NC}"

echo ""
echo -e "${GREEN}🆘 Crisis Healthcare System Ready for Deployment${NC}"
echo -e "${GREEN}🏛️ Built by Hora e.V., Modern Miracle & JurisCanada${NC}"
echo -e "${GREEN}🇪🇺 Supported by NGI Sargasso / EU Horizon Europe${NC}"