#!/bin/bash

# Application startup script
set -e
cd /var/www/fitness-tracker

echo "Installing dependencies..."
npm install --production

echo "Setting permissions..."
chown -R www-data:www-data /var/www/fitness-tracker
chmod -R 755 /var/www/fitness-tracker

echo "Checking files..."
ls -la
echo "Checking server.js..."
cat server.js | head -10

echo "Testing Node.js syntax..."
node -c server.js || echo "Syntax error in server.js"

echo "Starting application..."
pm2 start server.js --name fitness-tracker

# Wait for app to start
sleep 10

echo "Checking app status..."
pm2 status fitness-tracker

echo "Checking PM2 logs..."
pm2 logs fitness-tracker --lines 20

echo "Testing local API..."
curl -f http://localhost:5001/api/health || echo "Local API failed"

pm2 save

echo "Deployment completed!"
echo "Application URL: http://$(curl -s ifconfig.me 2>/dev/null || echo '178.212.12.73')"
