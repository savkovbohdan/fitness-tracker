#!/bin/bash

# Alternative SSL Setup Script (for IP addresses)
set -e

echo "🔒 Setting up SSL certificates for IP address..."

# Install OpenSSL if not installed
echo "Installing OpenSSL..."
sudo apt-get update
sudo apt-get install -y openssl

# Create directory for certificates
sudo mkdir -p /etc/ssl/private

# Generate self-signed certificate
echo "Generating self-signed certificate for 178.212.12.73..."
sudo openssl req -x509 \
    -nodes \
    -days 365 \
    -newkey rsa:2048 \
    -keyout /etc/ssl/private/178.212.12.73.key \
    -out /etc/ssl/certs/178.212.12.73.crt \
    -subj "/C=RU/ST=State/L=City/O=Organization/CN=178.212.12.73"

# Set proper permissions
sudo chmod 600 /etc/ssl/private/178.212.12.73.key
sudo chmod 644 /etc/ssl/certs/178.212.12.73.crt

# Open firewall ports
echo "Opening firewall ports..."
sudo ufw allow 443/tcp || echo "Port 443 already allowed"
sudo ufw allow 80/tcp || echo "Port 80 already allowed"
sudo ufw reload || echo "Firewall reload failed"

# Check if certificates were created
echo "Checking SSL certificates..."
if [ -f "/etc/ssl/certs/178.212.12.73.crt" ]; then
    echo "✅ Self-signed SSL certificates created successfully!"
    echo "📁 Certificate location: /etc/ssl/certs/178.212.12.73.crt"
    echo "🔑 Private key location: /etc/ssl/private/178.212.12.73.key"
    
    # Update server.js to use self-signed certificates
    echo "Updating server.js to use self-signed certificates..."
    sudo sed -i 's|/etc/letsencrypt/live/178.212.12.73/privkey.pem|/etc/ssl/private/178.212.12.73.key|g' /var/www/fitness-tracker/server.js
    sudo sed -i 's|/etc/letsencrypt/live/178.212.12.73/cert.pem|/etc/ssl/certs/178.212.12.73.crt|g' /var/www/fitness-tracker/server.js
    sudo sed -i 's|/etc/letsencrypt/live/178.212.12.73/chain.pem|/etc/ssl/certs/178.212.12.73.crt|g' /var/www/fitness-tracker/server.js
    
    # Restart the application to enable HTTPS
    echo "Restarting application to enable HTTPS..."
    pm2 restart fitness-tracker || echo "App restart failed"
    
    echo "🌐 Your application is now available at:"
    echo "   HTTP:  http://178.212.12.73:5001"
    echo "   HTTPS: https://178.212.12.73"
    echo ""
    echo "⚠️  Note: This is a self-signed certificate."
    echo "   Browsers will show a security warning."
    echo "   Users need to click 'Advanced' -> 'Proceed to 178.212.12.73'"
    echo ""
    echo "🔒 Self-signed SSL setup completed!"
else
    echo "❌ SSL certificate setup failed!"
    echo "Please check the error messages above."
fi

echo "📝 Certificate valid for 365 days"
echo "📝 To renew: run this script again after 365 days"
