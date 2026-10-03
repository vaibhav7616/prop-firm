#!/bin/sh
set -e

echo "=================================================="
echo "FundedShift Prop Firm - Docker Build & Start"
echo "=================================================="

# Check if docker is installed
if ! command -v docker > /dev/null 2>&1; then
    echo "❌ Error: Docker is not installed or not in PATH."
    exit 1
fi

echo "📦 1. Building Docker containers (FundedShift App + PostgreSQL)..."
docker compose build

echo "🚀 2. Starting Docker containers in background..."
docker compose up -d

echo "⏳ 3. Waiting for services to become healthy..."
sleep 5

docker compose ps

echo "=================================================="
echo "✅ FundedShift is running!"
echo "🌐 Web Terminal & API: http://localhost:3000"
echo "🩺 Health Check:       http://localhost:3000/api/health"
echo "🧪 Verification Suite: http://localhost:3000/api/tests/run"
echo "=================================================="
