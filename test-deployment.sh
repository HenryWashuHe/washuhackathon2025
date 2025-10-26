#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Testing SCDS Deployment..."
echo "================================"

# Test backend health
echo -e "\n${YELLOW}1. Testing Backend API:${NC}"
echo "   URL: https://api.miaomiaobadcat.com/"
BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://api.miaomiaobadcat.com/)
if [ "$BACKEND_RESPONSE" = "200" ]; then
    echo -e "   ${GREEN}✓ Backend is healthy (Status: $BACKEND_RESPONSE)${NC}"
    curl -s https://api.miaomiaobadcat.com/ | python3 -m json.tool
else
    echo -e "   ${RED}✗ Backend is not responding properly (Status: $BACKEND_RESPONSE)${NC}"
fi

# Test frontend health
echo -e "\n${YELLOW}2. Testing Frontend Health Check:${NC}"
echo "   URL: https://miaomiaobadcat.com/api/health"
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://miaomiaobadcat.com/api/health)
if [ "$FRONTEND_HEALTH" = "200" ]; then
    echo -e "   ${GREEN}✓ Frontend health check passed (Status: $FRONTEND_HEALTH)${NC}"
    curl -s https://miaomiaobadcat.com/api/health | python3 -m json.tool
else
    echo -e "   ${RED}✗ Frontend health check failed (Status: $FRONTEND_HEALTH)${NC}"
fi

# Test CORS headers
echo -e "\n${YELLOW}3. Testing CORS Configuration:${NC}"
echo "   Testing preflight request from miaomiaobadcat.com to API..."
CORS_RESPONSE=$(curl -s -I -X OPTIONS https://api.miaomiaobadcat.com/analyze \
  -H "Origin: https://miaomiaobadcat.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type")

if echo "$CORS_RESPONSE" | grep -q "access-control-allow-origin"; then
    echo -e "   ${GREEN}✓ CORS headers are present${NC}"
    echo "$CORS_RESPONSE" | grep -i "access-control"
else
    echo -e "   ${RED}✗ CORS headers missing${NC}"
fi

# Test analyze endpoint
echo -e "\n${YELLOW}4. Testing Analyze Endpoint:${NC}"
echo "   Sending test request to /analyze..."
TEST_PAYLOAD='{
  "location": {"lat": 38.6270, "lng": -90.1994, "name": "St. Louis, MO"},
  "radius": 50,
  "priorities": {"cropYield": 5, "irrigation": 5, "soilHealth": 5},
  "userPrompt": "Test analysis"
}'

ANALYZE_RESPONSE=$(curl -s -X POST https://api.miaomiaobadcat.com/analyze \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD" \
  -w "\nHTTP_STATUS:%{http_code}" \
  --max-time 10)

HTTP_STATUS=$(echo "$ANALYZE_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "   ${GREEN}✓ Analyze endpoint is working (Status: $HTTP_STATUS)${NC}"
else
    echo -e "   ${RED}✗ Analyze endpoint failed (Status: $HTTP_STATUS)${NC}"
    echo "   Response: $(echo "$ANALYZE_RESPONSE" | head -n 5)"
fi

echo -e "\n================================"
echo "📊 Deployment Test Complete!"
