#!/usr/bin/env bash
# Exit on error
set -o errexit

# Build React frontend
cd frontend  # Navigate to your React app directory
npm install
CI=false npm run build
cd ..

# Install Python dependencies
cd backend  
pip install -r requirements.txt