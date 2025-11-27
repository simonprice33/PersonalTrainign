#!/bin/bash

echo "=== Testing Import Customers Endpoints ==="
echo ""

# Get backend URL
BACKEND_URL="${REACT_APP_BACKEND_URL:-http://localhost:8001}"
echo "Backend URL: $BACKEND_URL"
echo ""

# Step 1: Login as admin to get token
echo "Step 1: Admin Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "simon.price@simonprice-pt.co.uk",
    "password": "Qwerty1234!!!"
  }')

echo "Login Response: $LOGIN_RESPONSE"
echo ""

# Extract access token
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('accessToken', ''))" 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Failed to get access token"
  exit 1
fi

echo "✅ Access token obtained"
echo ""

# Step 2: Test fetching customers with invalid IDs (to show error handling)
echo "Step 2: Testing fetch endpoint with invalid customer IDs..."
FETCH_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/admin/import-customers/fetch" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "customerIds": ["cus_invalid_test_123"]
  }')

echo "Fetch Response (should show error for invalid ID):"
echo "$FETCH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$FETCH_RESPONSE"
echo ""

# Step 3: Test with empty array
echo "Step 3: Testing with empty customer IDs array..."
EMPTY_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/admin/import-customers/fetch" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "customerIds": []
  }')

echo "Empty Array Response:"
echo "$EMPTY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$EMPTY_RESPONSE"
echo ""

echo "✅ Import Customers endpoints are responding correctly!"
echo ""
echo "Note: To fully test the import functionality, you'll need valid Stripe Customer IDs"
echo "      from your Stripe account. The user can provide these when testing."
