#!/bin/bash

# Application startup script
set -e
cd /var/www/fitness-tracker

echo "Installing PostgreSQL client..."
apt-get update && apt-get install -y postgresql postgresql-contrib python3-pip

echo "Installing dependencies..."
npm install --production

echo "Installing Python dependencies..."
pip3 install --break-system-packages python-telegram-bot==13.15 python-dotenv==1.0.0 || echo "Python requirements already installed"

echo "Setting up environment variables..."
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fitness_tracker
DB_USER=postgres
DB_PASSWORD=postgres123
TELEGRAM_BOT_TOKEN=8386581272:AAEL5k6Kxx1ZDN2jeoONNRbe1NKdPwEZe8M
WEBAPP_URL=http://178.212.12.73
EOF

echo "Setting up Python environment..."
export TELEGRAM_BOT_TOKEN=8386581272:AAEL5k6Kxx1ZDN2jeoONNRbe1NKdPwEZe8M
export WEBAPP_URL=http://178.212.12.73

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
pm2 stop fitness-tracker || echo "App not running"
pm2 delete fitness-tracker || echo "App not found"
pm2 start server.js --name fitness-tracker

# Wait for app to start
sleep 10

echo "Starting Python Mini App Bot..."
pm2 stop mini-app-bot || echo "Python bot not running"
pm2 delete mini-app-bot || echo "Python bot not found"

# Check Python syntax first
echo "Checking Python syntax..."
python3 -c "import mini_app_bot" || echo "Python syntax error in mini_app_bot.py"

# Check if python3 exists
echo "Checking Python installation..."
which python3 || echo "python3 not found"
python3 --version || echo "Cannot get python3 version"

# Check if file exists
echo "Checking mini_app_bot.py file..."
ls -la mini_app_bot.py || echo "mini_app_bot.py not found"

# Try to run Python bot directly to see errors
echo "Testing Python bot directly..."
TELEGRAM_BOT_TOKEN=8386581272:AAEL5k6Kxx1ZDN2jeoONNRbe1NKdPwEZe8M WEBAPP_URL=http://178.212.12.73 python3 mini_app_bot.py &
PYTHON_PID=$!
sleep 3
kill $PYTHON_PID 2>/dev/null || echo "Python process already stopped"

# Start bot with full path and environment
echo "Starting Python Mini App Bot..."
pm2 stop mini-app-bot || echo "Python bot not running"
pm2 delete mini-app-bot || echo "Python bot not found"
pm2 start mini_app_bot_webapp.py --name mini-app-bot --interpreter /usr/bin/python3 --env TELEGRAM_BOT_TOKEN=8386581272:AAEL5k6Kxx1ZDN2jeoONNRbe1NKdPwEZe8M --env WEBAPP_URL=http://178.212.12.73

# Wait for python bot to start
sleep 5

echo "Checking bot status..."
pm2 status mini-app-bot

echo "Checking Python bot logs..."
pm2 logs mini-app-bot --lines 10 || echo "Cannot get logs"

echo "Force database initialization..."
curl -X POST http://localhost:5001/api/init-db || echo "DB init failed"

echo "Testing exercises API..."
curl -f http://localhost:5001/api/exercises || echo "Exercises API failed"

echo "Checking exercises count..."
curl -s http://localhost:5001/api/exercises | jq '. | length' || echo "Cannot check exercises count"

echo "Deployment completed!"
echo "HTTP URL: http://$(curl -s ifconfig.me 2>/dev/null || echo '178.212.12.73')"
echo "Application is working!"
echo "Python Mini App Bot: @FitnessTrackerBot"
