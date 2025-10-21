#!/bin/bash

echo "🚀 Starting server and testing customer sub-brand filtering..."

# Start server in background
cd /Users/gblessylva/development/shopify/shopify-to-sheets/server
node index.js &
SERVER_PID=$!

echo "Server PID: $SERVER_PID"

# Wait for server to start
sleep 3

echo ""
echo "📊 Testing Football filter..."
curl -s "http://localhost:5000/api/orders?customerSubBrand=Football&limit=3" | head -200

echo ""
echo ""
echo "📊 Testing Basketball filter..."
curl -s "http://localhost:5000/api/orders?customerSubBrand=Basketball&limit=3" | head -200

echo ""
echo ""
echo "📊 Testing Hockey filter..."
curl -s "http://localhost:5000/api/orders?customerSubBrand=Hockey&limit=3" | head -200

echo ""
echo ""
echo "📊 Testing recent order to see customer_sub_brand values..."
curl -s "http://localhost:5000/api/orders?limit=1" | head -100

# Kill server
kill $SERVER_PID
echo ""
echo "✅ Test complete, server stopped"