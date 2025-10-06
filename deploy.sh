#!/bin/bash

# Render deployment script
echo "🚀 Starting deployment..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server && npm install && cd ..

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client && npm install && cd ..

# Build client
echo "🔨 Building client..."
cd client && npm run build && cd ..

echo "✅ Deployment complete!"
echo "🌟 Your app is ready to serve from the server directory"