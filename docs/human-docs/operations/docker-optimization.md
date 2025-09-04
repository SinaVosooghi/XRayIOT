# Docker Build Optimization Plan

## Current Docker Build Analysis
- **Build Time**: ~5-8 minutes per service
- **Image Size**: ~200-300MB per service
- **Cache Efficiency**: Limited layer caching
- **Build Strategy**: Basic multi-stage builds

## Optimization Strategy

### 1. Multi-Stage Build Optimization

#### Optimized Base Dockerfile Template
```dockerfile
# apps/api/Dockerfile.optimized
# Stage 1: Base image with common dependencies
FROM node:22-alpine AS base
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nestjs

# Stage 2: Dependencies (cached layer)
FROM base AS deps
WORKDIR /app

# Copy package files for better caching
COPY package.json yarn.lock* ./
COPY apps/api/package.json ./apps/api/
COPY libs/*/package.json ./libs/*/

# Enable corepack and install dependencies
RUN corepack enable \
    && yarn install --frozen-lockfile --production=false \
    && yarn cache clean

# Stage 3: Build (cached layer)
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/yarn.lock ./

# Copy source code
COPY . .

# Build only the specific app
RUN corepack enable \
    && yarn build:api \
    && yarn install --frozen-lockfile --production=true \
    && yarn cache clean

# Stage 4: Production (minimal)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy built application and production dependencies
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/apps/api/src/main.js"]
```

### 2. Build Cache Optimization

#### Docker BuildKit Configuration
```dockerfile
# .dockerignore
node_modules
npm-debug.log
yarn-error.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.nyc_output
.coverage
dist
build
*.log
.DS_Store
Thumbs.db
```

#### Build Script with Cache
```bash
#!/bin/bash
# scripts/build-docker.sh

set -e

# Enable BuildKit for better caching
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Build arguments for cache optimization
BUILD_ARGS="--build-arg BUILDKIT_INLINE_CACHE=1"

# Services to build
SERVICES=("api" "signals" "producer")

echo "🐳 Building Docker images with optimized caching..."

for service in "${SERVICES[@]}"; do
    echo "📦 Building $service service..."
    
    # Build with cache
    docker build \
        $BUILD_ARGS \
        --cache-from xrayiot/$service:latest \
        --cache-from xrayiot/$service:cache \
        -t xrayiot/$service:latest \
        -t xrayiot/$service:cache \
        -f apps/$service/Dockerfile.optimized \
        .
    
    echo "✅ $service build completed"
done

echo "🎉 All Docker images built successfully!"
```

### 3. Layer Caching Strategy

#### Optimized Layer Order
```dockerfile
# Optimize layer caching by ordering from least to most frequently changing
FROM node:22-alpine AS base

# 1. System dependencies (rarely change)
RUN apk add --no-cache libc6-compat dumb-init

# 2. User creation (rarely change)
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nestjs

# 3. Package files (change less frequently than source)
COPY package.json yarn.lock* ./
COPY apps/*/package.json ./apps/*/
COPY libs/*/package.json ./libs/*/

# 4. Dependencies (change when package.json changes)
RUN corepack enable && yarn install --frozen-lockfile

# 5. Source code (changes most frequently)
COPY . .

# 6. Build (changes when source changes)
RUN yarn build:api
```

### 4. Multi-Architecture Builds

#### Buildx Configuration
```yaml
# .github/workflows/docker-build.yml
name: Docker Build (Multi-Arch)

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
        
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./apps/api/Dockerfile.optimized
          platforms: linux/amd64,linux/arm64
          push: true
          tags: |
            xrayiot/api:latest
            xrayiot/api:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### 5. Image Size Optimization

#### Alpine-based Production Images
```dockerfile
# Use distroless or minimal base for production
FROM gcr.io/distroless/nodejs22-debian12 AS runner
WORKDIR /app

# Copy only necessary files
COPY --from=builder --chown=nonroot:nonroot /app/dist ./dist
COPY --from=builder --chown=nonroot:nonroot /app/node_modules ./node_modules

# Use distroless user
USER nonroot

EXPOSE 3000

CMD ["dist/apps/api/src/main.js"]
```

#### Multi-stage Build with Size Optimization
```dockerfile
# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock* ./
RUN corepack enable && yarn install --frozen-lockfile

# Stage 2: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && yarn build:api

# Stage 3: Production dependencies only
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package.json yarn.lock* ./
RUN corepack enable \
    && yarn install --frozen-lockfile --production=true \
    && yarn cache clean

# Stage 4: Minimal production image
FROM node:22-alpine AS runner
WORKDIR /app

# Install only runtime dependencies
RUN apk add --no-cache dumb-init

# Copy production dependencies and built app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nestjs \
    && chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/apps/api/src/main.js"]
```

### 6. Build Performance Optimization

#### Parallel Builds
```bash
#!/bin/bash
# scripts/build-parallel.sh

# Build all services in parallel
docker build -f apps/api/Dockerfile.optimized -t xrayiot/api:latest . &
docker build -f apps/signals/Dockerfile.optimized -t xrayiot/signals:latest . &
docker build -f apps/producer/Dockerfile.optimized -t xrayiot/producer:latest . &

# Wait for all builds to complete
wait

echo "All builds completed!"
```

#### Build Cache Management
```bash
#!/bin/bash
# scripts/docker-cache.sh

# Prune unused cache
docker builder prune -f

# Build with cache
docker build \
  --cache-from xrayiot/api:cache \
  --cache-to xrayiot/api:cache \
  -t xrayiot/api:latest \
  -f apps/api/Dockerfile.optimized \
  .
```

### 7. Development vs Production Builds

#### Development Dockerfile
```dockerfile
# apps/api/Dockerfile.dev
FROM node:22-alpine AS dev
WORKDIR /app

# Install development dependencies
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json yarn.lock* ./
COPY apps/api/package.json ./apps/api/
COPY libs/*/package.json ./libs/*/

# Install all dependencies (including dev)
RUN corepack enable && yarn install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start in development mode
CMD ["yarn", "start:dev:api"]
```

#### Production Dockerfile
```dockerfile
# apps/api/Dockerfile.prod
# Use the optimized production Dockerfile from above
```

### 8. Build Monitoring and Metrics

#### Build Time Tracking
```bash
#!/bin/bash
# scripts/build-with-metrics.sh

start_time=$(date +%s)

echo "🚀 Starting Docker build..."

# Build with timing
time docker build \
  --cache-from xrayiot/api:cache \
  --cache-to xrayiot/api:cache \
  -t xrayiot/api:latest \
  -f apps/api/Dockerfile.optimized \
  .

end_time=$(date +%s)
build_time=$((end_time - start_time))

echo "⏱️ Build completed in ${build_time} seconds"

# Log build metrics
echo "Build time: ${build_time}s" >> build-metrics.log
```

#### Image Size Analysis
```bash
#!/bin/bash
# scripts/analyze-image-size.sh

echo "📊 Docker Image Size Analysis"

for service in api signals producer; do
    size=$(docker images xrayiot/$service:latest --format "table {{.Size}}")
    echo "$service: $size"
done

# Detailed analysis
docker images xrayiot/*:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
```

### 9. CI/CD Integration

#### GitHub Actions with Cache
```yaml
# .github/workflows/docker-build-optimized.yml
name: Docker Build (Optimized)

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [api, signals, producer]
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
        
      - name: Build with cache
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./apps/${{ matrix.service }}/Dockerfile.optimized
          push: false
          tags: xrayiot/${{ matrix.service }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
          
      - name: Analyze image size
        run: |
          docker images xrayiot/${{ matrix.service }}:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

### 10. Performance Benchmarks

#### Build Time Targets
- **Initial Build**: <3 minutes per service
- **Cached Build**: <30 seconds per service
- **Parallel Build**: <5 minutes for all services
- **Image Size**: <150MB per service

#### Optimization Results
```bash
# Before optimization
# Build time: 5-8 minutes per service
# Image size: 200-300MB per service
# Cache hit rate: ~20%

# After optimization
# Build time: 2-3 minutes per service (initial), 20-30 seconds (cached)
# Image size: 100-150MB per service
# Cache hit rate: ~80%
```

## Implementation Plan

### Phase 1: Dockerfile Optimization (Week 1)
- [ ] Create optimized Dockerfiles for all services
- [ ] Implement multi-stage builds
- [ ] Add proper layer caching
- [ ] Target: 50% build time reduction

### Phase 2: Build Cache Implementation (Week 2)
- [ ] Set up BuildKit
- [ ] Implement cache strategies
- [ ] Add parallel builds
- [ ] Target: 80% cache hit rate

### Phase 3: CI/CD Integration (Week 3)
- [ ] Update GitHub Actions
- [ ] Add build metrics
- [ ] Implement automated testing
- [ ] Target: <3 minutes total build time

### Phase 4: Monitoring and Optimization (Week 4)
- [ ] Add build monitoring
- [ ] Optimize image sizes
- [ ] Implement build analytics
- [ ] Target: <150MB image size

## Success Metrics

### Build Performance
- **Build Time**: <3 minutes (initial), <30 seconds (cached)
- **Cache Hit Rate**: >80%
- **Parallel Build**: <5 minutes for all services
- **Image Size**: <150MB per service

### Developer Experience
- **Local Build**: <2 minutes
- **CI Build**: <3 minutes
- **Cache Efficiency**: >80% hit rate
- **Build Reliability**: >99% success rate
