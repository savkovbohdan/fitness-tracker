#!/bin/bash

# SSL Setup Script for Fitness Tracker
set -e

echo "🔒 Setting up SSL certificates for Fitness Tracker..."

# Install certbot if not installed
echo "Installing certbot..."
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Stop nginx if running
echo "Stopping nginx if running..."
sudo systemctl stop nginx || echo "Nginx not running"

# Open firewall ports
echo "Opening firewall ports..."
sudo ufw allow 443/tcp || echo "Port 443 already allowed"
sudo ufw allow 80/tcp || echo "Port 80 already allowed"
sudo ufw reload || echo "Firewall reload failed"

# Get SSL certificate
echo "Getting SSL certificate for 178.212.12.73..."
sudo certbot certonly --standalone -d 178.212.12.73 \
    --non-interactive \
    --agree-tos \
    --email admin@178.212.12.73 \
    --register-unsafely-without-email || echo "SSL setup failed or already exists"

# Check if certificates were created
echo "Checking SSL certificates..."
if [ -f "/etc/letsencrypt/live/178.212.12.73/privkey.pem" ]; then
    echo "✅ SSL certificates created successfully!"
    echo "📁 Certificate location: /etc/letsencrypt/live/178.212.12.73/"
    
    # List certificate files
    sudo ls -la /etc/letsencrypt/live/178.212.12.73/
    
    # Restart the application to enable HTTPS
    echo "Restarting application to enable HTTPS..."
    pm2 restart fitness-tracker || echo "App restart failed"
    
    echo "🌐 Your application is now available at:"
    echo "   HTTP:  http://178.212.12.73:5001"
    echo "   HTTPS: https://178.212.12.73"
    
    echo "🔒 SSL setup completed successfully!"
else
    echo "❌ SSL certificate setup failed!"
    echo "Please check the error messages above."
    echo "You can try running this script again."
fi

echo "📝 Note: SSL certificates auto-renew every 90 days"
echo "📝 To check renewal: sudo certbot renew --dry-run"
