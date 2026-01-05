import os
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
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
    """Обработчик команды /start - запускает Mini App внутри Telegram"""
    user = update.effective_user
    
    logger.info(f"User {user.first_name} (@{user.username}) started bot")
    
    welcome_text = f"""
🏋️‍♂️ Добро пожаловать в Фитнес-Трекер, {user.first_name}!

📱 Это Telegram Mini App версия фитнес-трекера!

🚀 Нажми кнопку ниже чтобы открыть приложение прямо в Telegram:
    """
    
    try:
        # Создаем WebAppInfo для Mini App
        web_app_info = WebAppInfo(url=MINI_APP_URL)
        
        # Создаем клавиатуру с Web App кнопкой
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton(
                text="🚀 Открыть Фитнес-Трекер",
                web_app=web_app_info
            )]
        ])
        
        # Отправляем сообщение с увеличенным таймаутом
        await update.message.reply_text(
            welcome_text,
            reply_markup=keyboard,
            read_timeout=10,
            write_timeout=10,
            connect_timeout=10
        )
        logger.info(f"Welcome message sent to user {user.id}")
        
    except Exception as e:
        logger.error(f"Error with WebApp: {e}")
        # Fallback с обычной ссылкой
        fallback_keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton(
                text="🚀 Открыть Фитнес-Трекер",
                url=MINI_APP_URL
            )]
        ])
        try:
            await update.message.reply_text(
                f"🏋️‍♂️ Фитнес-Трекер\n\n"
                f"🚀 Открой приложение: {MINI_APP_URL}",
                reply_markup=fallback_keyboard,
                read_timeout=10,
                write_timeout=10,
                connect_timeout=10
            )
        except Exception as e2:
            logger.error(f"Fallback also failed: {e2}")
            # Последний вариант - просто текст
            await update.message.reply_text(
                f"🏋️‍♂️ Фитнес-Трекер\n\n"
                f"🚀 Открой приложение: {MINI_APP_URL}",
                read_timeout=10,
                write_timeout=10,
                connect_timeout=10
            )

def main():
    """Основная функция запуска бота"""
    logger.info("Starting Mini App Bot with WebApp support...")
    logger.info(f"Mini App URL: {MINI_APP_URL}")
    
    try:
        # Создаем приложение с увеличенными таймаутами
        application = Application.builder().token(TELEGRAM_BOT_TOKEN).connect_timeout(10).read_timeout(10).write_timeout(10).build()
        
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
