#!/bin/bash

# Application startup script
set -e
cd /var/www/fitness-tracker

echo "Installing dependencies..."
npm install --production

echo "Setting permissions..."
chown -R www-data:www-data /var/www/fitness-tracker
chmod -R 755 /var/www/fitness-tracker

echo "Starting application..."
pm2 start server.js --name fitness-tracker
pm2 save

echo "Deployment completed!"
echo "Application URL: http://$(curl -s ifconfig.me 2>/dev/null || echo '178.212.12.73')"
