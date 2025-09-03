#!/bin/bash

# XRay IoT E2E Test Script
# This script properly loads environment variables and runs e2e tests with Docker Compose

set -e  # Exit on any error

echo "🚀 Starting XRay IoT E2E Tests..."

# Load environment variables from .env.test
echo "📋 Loading environment variables from .env.test..."
set -a  # Automatically export all variables
source .env.test
set +a  # Stop automatically exporting

# Verify required environment variables are set
echo "🔍 Verifying environment configuration..."
required_vars=("API_PORT" "PRODUCER_PORT" "MONGO_PORT" "RABBITMQ_PORT" "REDIS_PORT")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Required environment variable $var is not set"
        exit 1
    fi
    echo "✅ $var=${!var}"
done

# Stop any existing containers
echo "🛑 Stopping any existing test containers..."
docker compose -f docker-compose.test-full.yml down --remove-orphans || true

# Build and start the test infrastructure
echo "🏗️ Building and starting test infrastructure..."
docker compose -f docker-compose.test-full.yml build --no-cache
docker compose -f docker-compose.test-full.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
timeout=300  # 5 minutes
elapsed=0
while [ $elapsed -lt $timeout ]; do
    if docker compose -f docker-compose.test-full.yml ps | grep -q "healthy"; then
        echo "✅ Services are healthy"
        break
    fi
    echo "⏳ Waiting for services... (${elapsed}s elapsed)"
    sleep 10
    elapsed=$((elapsed + 10))
done

if [ $elapsed -ge $timeout ]; then
    echo "❌ Timeout waiting for services to be healthy"
    docker compose -f docker-compose.test-full.yml logs
    exit 1
fi

# Verify services are responding
echo "🔍 Verifying service endpoints..."
API_URL="http://localhost:${API_PORT}"
PRODUCER_URL="http://localhost:${PRODUCER_PORT}"

# Test API health
if ! curl -s "${API_URL}/api/health" | grep -q '"status":"ok"'; then
    echo "❌ API service is not responding at ${API_URL}/api/health"
    docker compose -f docker-compose.test-full.yml logs api-test
    exit 1
fi
echo "✅ API service is responding"

# Test Producer health
if ! curl -s "${PRODUCER_URL}/test/health" | grep -q '"status":"ok"'; then
    echo "❌ Producer service is not responding at ${PRODUCER_URL}/test/health"
    docker compose -f docker-compose.test-full.yml logs producer-test
    exit 1
fi
echo "✅ Producer service is responding"

# Run the e2e tests
echo "🧪 Running e2e tests..."
yarn test:e2e

# Capture test results
test_exit_code=$?

# Clean up
echo "🧹 Cleaning up test infrastructure..."
docker compose -f docker-compose.test-full.yml down --remove-orphans

# Exit with test results
if [ $test_exit_code -eq 0 ]; then
    echo "🎉 All e2e tests passed!"
else
    echo "❌ Some e2e tests failed"
fi

exit $test_exit_code
