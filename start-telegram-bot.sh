#!/bin/bash

# Telegram Bot Startup Script
set -e

echo "🤖 Starting Telegram Bot..."

# Navigate to project directory
cd /var/www/fitness-tracker

# Check if bot token is set
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating .env file..."
    cat > .env << EOF
TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN_HERE
WEBAPP_URL=http://178.212.12.73
EOF
    echo "📝 Please edit .env file and add your Telegram Bot Token"
    echo "📝 Get your token from @BotFather on Telegram"
    exit 1
fi

# Load environment variables
source .env

# Check if token is set
if [ "$TELEGRAM_BOT_TOKEN" = "YOUR_TELEGRAM_BOT_TOKEN_HERE" ]; then
    echo "❌ Please set your Telegram Bot Token in .env file"
    echo "📝 Edit .env file and replace YOUR_TELEGRAM_BOT_TOKEN_HERE with your actual token"
    exit 1
fi

echo "✅ Environment loaded"
echo "🤖 Bot Token: ${TELEGRAM_BOT_TOKEN:0:15}..."
echo "🌐 Web App URL: ${WEBAPP_URL}"

# Install dependencies if needed
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the bot
echo "🚀 Starting Telegram Bot..."
pm2 start telegram-bot || echo "Bot already running, restarting..."
pm2 restart telegram-bot || echo "Bot restarted"

# Wait a moment for startup
sleep 5

# Check bot status
echo "📊 Checking bot status..."
pm2 status telegram-bot

# Check bot logs
echo "📋 Checking bot logs..."
pm2 logs telegram-bot --lines 10

echo "🎯 Telegram Bot started successfully!"
echo "🤖 Find your bot: @FitnessTrackerBot"
echo "📱 Web App: ${WEBAPP_URL}"
echo ""
echo "📝 Available commands:"
echo "  /start - Главное меню"
echo "  /app - Открыть веб-приложение"
echo "  /stats - Моя статистика"
echo "  /history - История тренировок"
echo "  /exercises - Упражнения"
echo "  /help - Помощь"
