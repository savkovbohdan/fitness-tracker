#!/bin/bash

# Database Reset Script
set -e

echo "🗑️  Resetting PostgreSQL database..."

# Check if user is root or has sudo privileges
if [ "$EUID" -ne 0 ]; then
    echo "This script requires sudo privileges. Please run with sudo."
    exit 1
fi

# Stop the application
echo "Stopping application..."
pm2 stop fitness-tracker || echo "Application not running"
pm2 delete fitness-tracker || echo "Application not found"

# Drop existing database
echo "Dropping existing database..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS fitness_tracker;" || echo "Database does not exist"

# Drop existing user (optional - keep user data)
echo "Dropping existing user..."
sudo -u postgres psql -c "DROP USER IF EXISTS fitness_user;" || echo "User does not exist"

# Create new database
echo "Creating new database..."
sudo -u postgres psql -c "CREATE DATABASE fitness_tracker;" || echo "Database already exists"

# Create new user
echo "Creating new user..."
sudo -u postgres psql -c "CREATE USER fitness_user WITH PASSWORD 'postgres123';" || echo "User already exists"

# Grant privileges
echo "Granting privileges..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE fitness_tracker TO fitness_user;" || echo "Privileges already granted"

# Set postgres password
echo "Setting postgres password..."
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres123';" || echo "Password already set"

echo "✅ Database reset completed!"
echo "🗄️  New database 'fitness_tracker' created"
echo "👤 New user 'fitness_user' created"
echo "🔐 Password set for postgres user"

# Start application
echo "Starting application..."
cd /var/www/fitness-tracker
pm2 start server.js --name fitness-tracker

# Wait for app to start
sleep 10

echo "Checking application status..."
pm2 status fitness-tracker

echo "Testing database initialization..."
curl -X POST http://localhost:5001/api/init-db || echo "DB init failed"

echo "Testing exercises API..."
curl -s http://localhost:5001/api/exercises | jq '. | length' || echo "Cannot check exercises count"

echo "🎯 Database reset and application restart completed!"
echo "🌐 Application URL: http://$(curl -s ifconfig.me 2>/dev/null || echo '178.212.12.73')"
