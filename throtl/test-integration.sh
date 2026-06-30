#!/bin/bash

# NetGuardian Frontend-Backend Integration Test Script

echo "🚀 NetGuardian Integration Test"
echo "=============================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Test 1: Check if frontend is running
echo -e "\n${YELLOW}1. Testing Frontend Server...${NC}"
if curl -s http://localhost:5174 > /dev/null; then
    echo -e "${GREEN}✅ Frontend server is running on http://localhost:5174${NC}"
else
    echo -e "${RED}❌ Frontend server is not accessible${NC}"
    echo "   Make sure to run: npm run dev"
fi

# Test 2: Check if backend is running
echo -e "\n${YELLOW}2. Testing Backend API...${NC}"
if curl -s http://localhost:8002/api/health/ > /dev/null; then
    echo -e "${GREEN}✅ Backend API is running on http://localhost:8002${NC}"
    
    # Test health endpoint
    echo -e "\n${YELLOW}   Health Check Response:${NC}"
    curl -s http://localhost:8002/api/health/ | python3 -m json.tool 2>/dev/null || echo "   Health endpoint responded"
else
    echo -e "${RED}❌ Backend API is not accessible${NC}"
    echo "   Make sure NetGuardian backend is running on port 8002"
fi

# Test 3: Test devices endpoint
echo -e "\n${YELLOW}3. Testing Devices Endpoint...${NC}"
if curl -s http://localhost:8002/api/devices/ > /dev/null; then
    echo -e "${GREEN}✅ Devices endpoint accessible${NC}"
    
    DEVICE_COUNT=$(curl -s http://localhost:8002/api/devices/ | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
    echo "   Found $DEVICE_COUNT devices"
else
    echo -e "${RED}❌ Devices endpoint not accessible${NC}"
fi

# Test 4: WebSocket connectivity test
echo -e "\n${YELLOW}4. Testing WebSocket Connection...${NC}"
if command -v wscat > /dev/null; then
    echo "   Testing WebSocket with wscat..."
    timeout 5 wscat -c ws://localhost:8002/ws/stats/ 2>/dev/null && echo -e "${GREEN}✅ WebSocket connection successful${NC}" || echo -e "${YELLOW}⚠️  WebSocket test timed out (this is normal)${NC}"
else
    echo -e "${YELLOW}⚠️  wscat not available for WebSocket testing${NC}"
    echo "   Install with: npm install -g wscat"
fi

# Test 5: Environment configuration
echo -e "\n${YELLOW}5. Checking Configuration...${NC}"
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ Environment file exists${NC}"
    grep -q "VITE_API_BASE_URL" .env && echo "   ✓ API URL configured" || echo "   ⚠️ API URL not configured"
    grep -q "VITE_WS_BASE_URL" .env && echo "   ✓ WebSocket URL configured" || echo "   ⚠️ WebSocket URL not configured"
else
    echo -e "${YELLOW}⚠️  No .env file found${NC}"
    echo "   Copy .env.example to .env and configure"
fi

echo -e "\n${YELLOW}Integration Summary:${NC}"
echo "====================="
echo "Frontend:    http://localhost:5174"
echo "Backend API: http://localhost:8002"
echo "WebSocket:   ws://localhost:8002/ws/stats/"
echo ""
echo "📱 Open the frontend URL in your browser to see the dashboard"
echo "🔧 Make sure the NetGuardian backend is running with network data"

# Optional: Open browser automatically (Windows)
if command -v start > /dev/null; then
    echo ""
    read -p "Open frontend in browser? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start http://localhost:5174
    fi
fi