#!/bin/bash

# Old Maid Game Deployment Script
echo "🚀 Deploying Old Maid Game to Vercel..."

# Navigate to project root
cd /Users/Chandu/Documents/GitHub/old-maid

# Build the client
echo "📦 Building client..."
cd old-maid/client
npm install
npm run build

# Go back to root for Vercel deployment
cd /Users/Chandu/Documents/GitHub/old-maid

# Deploy to Vercel non-interactively
echo "🌐 Deploying to Vercel..."
npx vercel --prod --yes --name old-maid-game --env REACT_APP_BACKEND_URL=wss://old-maid-production.up.railway.app

echo "✅ Deployment complete!"
