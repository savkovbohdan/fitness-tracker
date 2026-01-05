import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes
import asyncio

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Токен бота
TELEGRAM_BOT_TOKEN = "8386581272:AAEL5k6Kxx1ZDN2jeoONNRbe1NKdPwEZe8M"
# URL Mini App
MINI_APP_URL = "http://178.212.12.73"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /start"""
    user = update.effective_user
    
    logger.info(f"User {user.first_name} (@{user.username}) started bot")
    
    welcome_text = f"""
🏋️‍♂️ Добро пожаловать в Фитнес-Трекер, {user.first_name}!

🚀 Нажми кнопку ниже чтобы открыть приложение:
{MINI_APP_URL}
    """
    
    try:
        await update.message.reply_text(welcome_text)
        logger.info(f"Welcome message sent to user {user.id}")
    except Exception as e:
        logger.error(f"Error sending message: {e}")

async def test_connection():
    """Тест подключения к Telegram API"""
    try:
        application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
        await application.initialize()
        logger.info("✅ Connection to Telegram API successful")
        return True
    except Exception as e:
        logger.error(f"❌ Connection error: {e}")
        return False

def main():
    """Основная функция запуска бота"""
    logger.info("Starting Simple Bot...")
    logger.info(f"Mini App URL: {MINI_APP_URL}")
    
    try:
        # Тест подключения
        logger.info("Testing connection to Telegram API...")
        
        # Создаем приложение с увеличенным таймаутом
        application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
        
        # Добавляем обработчик команды /start
        application.add_handler(CommandHandler("start", start))
        
        logger.info("Bot is ready!")
        logger.info("Bot is running...")
        
        # Запускаем бота
        application.run_polling()
        
    except Exception as e:
        logger.error(f"Error starting bot: {e}")
        print(f"ERROR: {e}")
        print("\nPossible solutions:")
        print("1. Check internet connection")
        print("2. Verify bot token is correct")
        print("3. Check if bot is not blocked")
        print("4. Try using VPN if Telegram is blocked")
        exit(1)

if __name__ == '__main__':
    main()
