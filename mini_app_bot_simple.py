import os
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

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
    """Обработчик команды /start - запускает Mini App"""
    user = update.effective_user
    
    logger.info(f"User {user.first_name} (@{user.username}) started bot")
    
    welcome_text = f"""
🏋️‍♂️ Добро пожаловать в Фитнес-Трекер, {user.first_name}!

🚀 Открой приложение по ссылке:
{MINI_APP_URL}

Или используй кнопку ниже:
    """
    
    # Создаем клавиатуру с обычной кнопкой-ссылкой
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            text="🚀 Открыть Фитнес-Трекер",
            url=MINI_APP_URL
        )]
    ])
    
    try:
        await update.message.reply_text(
            welcome_text,
            reply_markup=keyboard,
            disable_web_page_preview=True
        )
        logger.info(f"Welcome message sent to user {user.id}")
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        await update.message.reply_text(
            f"🏋️‍♂️ Фитнес-Трекер\n\n"
            f"🚀 Открой приложение: {MINI_APP_URL}"
        )

def main():
    """Основная функция запуска бота"""
    logger.info("Starting Mini App Bot...")
    logger.info(f"Mini App URL: {MINI_APP_URL}")
    
    try:
        # Создаем приложение
        application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
        
        # Добавляем обработчик команды /start
        application.add_handler(CommandHandler("start", start))
        
        logger.info("Bot is ready!")
        logger.info("Bot is running...")
        
        # Запускаем бота
        application.run_polling()
        
    except Exception as e:
        logger.error(f"Error starting bot: {e}")
        exit(1)

if __name__ == '__main__':
    main()
