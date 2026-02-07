#!/bin/bash

# Comprehensive API Test Script
# Tests all endpoints and identifies 404 and 500 errors

BASE_URL="http://localhost:4000"
RESULTS_FILE="/tmp/api-test-results.txt"

echo "🧪 Comprehensive API Test - $(date)" > $RESULTS_FILE
echo "=================================" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    local description=$5
    
    echo -n "Testing: $description... "
    
    if [ -z "$token" ]; then
        if [ -z "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data")
        fi
    else
        if [ -z "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
                -H "Authorization: Bearer $token")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
                -H "Authorization: Bearer $token" \
                -H "Content-Type: application/json" \
                -d "$data")
        fi
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    # Log to file
    echo "[$method] $endpoint - HTTP $http_code" >> $RESULTS_FILE
    echo "Description: $description" >> $RESULTS_FILE
    echo "Response: $body" >> $RESULTS_FILE
    echo "---" >> $RESULTS_FILE
    
    # Console output with colors
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ $http_code${NC}"
    elif [ "$http_code" -eq 401 ] || [ "$http_code" -eq 403 ]; then
        echo -e "${YELLOW}⚠ $http_code (Auth)${NC}"
    elif [ "$http_code" -eq 404 ]; then
        echo -e "${RED}✗ 404 NOT FOUND${NC}"
    elif [ "$http_code" -ge 500 ]; then
        echo -e "${RED}✗ $http_code SERVER ERROR${NC}"
    else
        echo -e "${YELLOW}⚠ $http_code${NC}"
    fi
}

echo "🔐 Step 1: Testing Authentication Endpoints"
echo "==========================================="

# Login to get token
echo "Logging in..."
login_response=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@robomanthan.com","password":"Test@123"}')

TOKEN=$(echo $login_response | jq -r '.accessToken')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed to get token. Creating test user...${NC}"
    node test-profile-api.js
    login_response=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@robomanthan.com","password":"Test@123"}')
    TOKEN=$(echo $login_response | jq -r '.accessToken')
fi

echo "Token obtained: ${TOKEN:0:30}..."
echo ""

# Test Auth Endpoints
test_endpoint "POST" "/auth/login" '{"email":"test@robomanthan.com","password":"Test@123"}' "" "Login"
test_endpoint "POST" "/auth/forgot-password" '{"email":"test@robomanthan.com"}' "" "Forgot Password"

echo ""
echo "👤 Step 2: Testing Profile Endpoints"
echo "====================================="
test_endpoint "GET" "/profile" "" "$TOKEN" "Get Profile"
test_endpoint "PUT" "/profile" '{"phone":"+1111111111"}' "$TOKEN" "Update Profile"

echo ""
echo "👥 Step 3: Testing Employee Endpoints"
echo "======================================"
test_endpoint "GET" "/employees" "" "$TOKEN" "Get All Employees"
test_endpoint "POST" "/employees" '{"name":"Test Employee","email":"emp@test.com","password":"Test@123","role":"EMPLOYEE","phone":"+1234567890","jobRole":"Developer"}' "$TOKEN" "Create Employee"

echo ""
echo "📝 Step 4: Testing Leave Endpoints"
echo "==================================="
test_endpoint "POST" "/leaves/apply" '{"type":"Sick Leave","reason":"Not feeling well","fromDate":"2026-02-10","toDate":"2026-02-11"}' "$TOKEN" "Apply Leave"
test_endpoint "GET" "/leaves/history" "" "$TOKEN" "Get Leave History"
test_endpoint "GET" "/leaves/pending" "" "$TOKEN" "Get Pending Leaves"
test_endpoint "GET" "/leaves/history/all" "" "$TOKEN" "Get All Leave History"
test_endpoint "GET" "/leaves/by-date?date=2026-02-10" "" "$TOKEN" "Get Leaves by Date"

echo ""
echo "📊 Step 5: Testing Dashboard Endpoints"
echo "======================================="
test_endpoint "GET" "/dashboard/employer" "" "$TOKEN" "Employer Dashboard"

echo ""
echo "📈 Step 6: Testing Report Endpoints"
echo "===================================="
test_endpoint "GET" "/reports/leaves/export" "" "$TOKEN" "Export Leaves CSV"
test_endpoint "GET" "/reports/leaves/export-excel" "" "$TOKEN" "Export Leaves Excel"

echo ""
echo "================================="
echo "✅ Test Complete!"
echo "Results saved to: $RESULTS_FILE"
echo ""
echo "Summary:"
grep "HTTP" $RESULTS_FILE | sort | uniq -c
