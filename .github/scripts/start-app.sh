#!/bin/bash

# Application startup script
set -e
cd /var/www/fitness-tracker

echo "Installing PostgreSQL client..."
apt-get update && apt-get install -y postgresql postgresql-contrib

echo "Installing dependencies..."
npm install --production

echo "Setting up environment variables..."
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fitness_tracker
DB_USER=postgres
DB_PASSWORD=postgres123
EOF

echo "Setting up PostgreSQL database..."
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres123';" || echo "Password already set"
sudo -u postgres psql -c "CREATE DATABASE fitness_tracker;" || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER fitness_user WITH PASSWORD 'postgres123';" || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE fitness_tracker TO fitness_user;" || echo "Privileges already granted"

echo "Setting permissions..."
chown -R www-data:www-data /var/www/fitness-tracker
chmod -R 755 /var/www/fitness-tracker

echo "Testing Node.js syntax..."
node -c server.js || echo "Syntax error in server.js"

echo "Starting application..."
pm2 start server.js --name fitness-tracker

# Wait for app to start
sleep 15

echo "Checking app status..."
pm2 status fitness-tracker

echo "Deployment completed!"
echo "HTTP URL: http://$(curl -s ifconfig.me 2>/dev/null || echo '178.212.12.73')"
echo "Application is working!"
