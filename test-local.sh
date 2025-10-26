#!/bin/bash

# Test local development setup
echo "🧪 Testing Local Development Setup..."
echo "====================================="

# Check if backend is running
echo -e "\n1. Checking Backend (localhost:8000):"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/)
if [ "$BACKEND_STATUS" = "200" ]; then
    echo "   ✓ Backend is running (Status: $BACKEND_STATUS)"
    curl -s http://localhost:8000/ | python3 -m json.tool
else
    echo "   ✗ Backend is not running (Status: $BACKEND_STATUS)"
    echo "   Run: cd backend && uvicorn main:app --reload"
fi

# Check if frontend is running
echo -e "\n2. Checking Frontend (localhost:3000):"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "   ✓ Frontend is running (Status: $FRONTEND_STATUS)"
else
    echo "   ✗ Frontend is not running (Status: $FRONTEND_STATUS)"
    echo "   Run: npm run dev"
fi

# Test frontend health endpoint
echo -e "\n3. Testing Frontend Health Check:"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ "$HEALTH_STATUS" = "200" ] || [ "$HEALTH_STATUS" = "503" ]; then
    echo "   ✓ Health endpoint responding (Status: $HEALTH_STATUS)"
    curl -s http://localhost:3000/api/health | python3 -m json.tool
else
    echo "   ✗ Health endpoint not responding (Status: $HEALTH_STATUS)"
fi

echo -e "\n====================================="
echo "✅ Local test complete!"
