import os
import logging
import asyncio
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes
from dotenv import load_dotenv

# Загрузка переменных окружения
load_dotenv()

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# URL для Mini App
MINI_APP_URL = os.getenv('WEBAPP_URL', 'http://178.212.12.73')
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')

# Проверка наличия токена
if not TELEGRAM_BOT_TOKEN:
    logger.error("TELEGRAM_BOT_TOKEN не найден в переменных окружения!")
    exit(1)

logger.info(f"Mini App URL: {MINI_APP_URL}")
logger.info(f"Bot Token: {TELEGRAM_BOT_TOKEN[:15]}...")

# Глобальная переменная для хранения статистики пользователей
user_stats = {}

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /start"""
    user = update.effective_user
    telegram_id = user.id
    username = user.username or 'no_username'
    first_name = user.first_name
    
    logger.info(f"📨 User {first_name} (@{username}) started bot")
    
    # Сохраняем информацию о пользователе
    user_stats[telegram_id] = {
        'first_name': first_name,
        'username': username,
        'started_at': datetime.now().isoformat(),
        'last_activity': datetime.now().isoformat()
    }
    
    welcome_text = f"""
🏋️‍♂️ Добро пожаловать в Фитнес-Трекер, {first_name}!

📱 *Что это?*
Это Telegram Mini App версия фитнес-трекера с полным функционалом:
- 📊 Отслеживание тренировок
- 💪 Выбор упражнений
- 📈 Личная статистика
- 📜 История тренировок
- ➕ Добавление своих упражнений
- 📷 Загрузка фотографий
- 🔄 Работа с собственным весом

🚀 *Как начать:*
Нажми кнопку ниже чтобы открыть приложение!

📱 *Mini App откроется прямо в Telegram!*

🔥 *Новые возможности:*
• Полная интеграция с веб-приложением
• Быстрый доступ к статистике
• Удобная навигация
• Автоматическое сохранение прогресса
    """
    
    # Создаем WebAppInfo для Mini App
    web_app_info = WebAppInfo(
        url=MINI_APP_URL,
        title="🏋️‍♂️ Фитнес-Трекер",
        description="Полнофункциональное приложение для отслеживания тренировок",
        text="Открыть Фитнес-Трекер"
    )
    
    # Создаем клавиатуру с кнопкой Mini App
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            text="🚀 Открыть Фитнес-Трекер",
            web_app=web_app_info
        )],
        [InlineKeyboardButton(
            text="📊 Моя статистика",
            callback_data="stats"
        )],
        [InlineKeyboardButton(
            text="📜 История тренировок",
            callback_data="history"
        )],
        [InlineKeyboardButton(
            text="💪 Упражнения",
            callback_data="exercises"
        )],
        [InlineKeyboardButton(
            text="ℹ️ Помощь",
            callback_data="help"
        )]
    ])
    
    try:
        await update.message.reply_text(
            welcome_text,
            reply_markup=keyboard,
            parse_mode='Markdown'
        )
        logger.info(f"✅ Welcome message sent to user {telegram_id}")
    except Exception as e:
        logger.error(f"❌ Error sending welcome message: {e}")
        await update.message.reply_text(
            "🏋️‍♂️ Добро пожаловать в Фитнес-Трекер!\n\n"
            "Используй кнопки ниже для навигации.",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton(
                    text="🚀 Открыть Фитнес-Трекер",
                    web_app=web_app_info
                )]
            ])
        )

async def stats_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик кнопки статистики"""
    query = update.callback_query
    user = update.effective_user
    telegram_id = user.id
    
    logger.info(f"📊 User {user.first_name} requested stats")
    
    # Обновляем время последней активности
    if telegram_id in user_stats:
        user_stats[telegram_id]['last_activity'] = datetime.now().isoformat()
    
    stats_text = f"""
📊 *Твоя статистика*

🏋️‍♂️ *Общая статистика:*
• Всего тренировок: {user_stats.get(telegram_id, {}).get('total_workouts', 0)}
• Уникальных упражнений: {user_stats.get(telegram_id, {}).get('unique_exercises', 0)}
• Всего повторений: {user_stats.get(telegram_id, {}).get('total_reps', 0)}
• Максимальный вес: {user_stats.get(telegram_id, {}).get('max_weight', 0)} кг
• Средний вес: {user_stats.get(telegram_id, {}).get('avg_weight', 0):.1f} кг

📈 *Последние достижения:*
• Новые рекорды: {user_stats.get(telegram_id, {}).get('new_records', 'пока нет')}
• Прогресс: {user_stats.get(telegram_id, {}).get('progress', 'отличный старт')}

💡 *Совет:*
Начни тренировку прямо сейчас!
Нажми кнопку "� Открыть Фитнес-Трекер" ниже.

📅 *Активность:*
• Последний визит: {user_stats.get(telegram_id, {}).get('last_activity', 'неизвестно')}
• Зарегистрирован: {user_stats.get(telegram_id, {}).get('started_at', 'неизвестно')}
    """
    
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            text="🚀 Открыть Фитнес-Трекер",
            web_app=WebAppInfo(
                url=MINI_APP_URL,
                title="🏋️‍♂️ Фитнес-Трекер",
                description="Открыть приложение",
                text="Открыть"
            )
        )],
        [InlineKeyboardButton(
            text="🔄 Обновить статистику",
            callback_data="refresh_stats"
        )],
        [InlineKeyboardButton(
            text="🔙 Назад",
            callback_data="back_to_menu"
        )]
    ])
    
    try:
        await query.answer()
        await query.edit_message_text(
            stats_text,
            reply_markup=keyboard,
            parse_mode='Markdown'
        )
        logger.info(f"✅ Stats sent to user {telegram_id}")
    except Exception as e:
        logger.error(f"❌ Error sending stats: {e}")
        await query.answer()
        await query.message.reply_text("❌ Произошла ошибка при загрузке статистики")

async def history_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик кнопки истории"""
    query = update.callback_query
    user = update.effective_user
    telegram_id = user.id
    
    logger.info(f"📜 User {user.first_name} requested history")
    
    # Обновляем время последней активности
    if telegram_id in user_stats:
        user_stats[telegram_id]['last_activity'] = datetime.now().isoformat()
    
    history_text = f"""
📜 *История тренировок*

📅 *Последние тренировки:*
• Пока нет тренировок

💡 *Как начать:*
1. Нажми "� Открыть Фитнес-Трекер"
2. Выбери упражнение из списка
3. Начни тренировку
4. Записывай подходы и вес
5. Следи за прогрессом!

🔄 *История появится автоматически* после первой тренировки

📊 *Статистика активности:*
• Всего сессий: {user_stats.get(telegram_id, {}).get('total_sessions', 0)}
• Последняя активность: {user_stats.get(telegram_id, {}).get('last_activity', 'неизвестно')}
    """
    
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            text="🚀 Открыть Фитнес-Трекер",
            web_app=WebAppInfo(
                url=MINI_APP_URL,
                title="🏋️‍♂️ Фитнес-Трекер",
                description="Открыть приложение",
                text="Открыть"
            )
        )],
        [InlineKeyboardButton(
            text="🔄 Обновить историю",
            callback_data="refresh_history"
        )],
        [InlineKeyboardButton(
            text="🔙 Назад",
            callback_data="back_to_menu"
        )]
    ])
    
    try:
        await query.answer()
        await query.edit_message_text(
            history_text,
            reply_markup=keyboard,
            parse_mode='Markdown'
        )
        logger.info(f"✅ History sent to user {telegram_id}")
    except Exception as e:
        logger.error(f"❌ Error sending history: {e}")
        await query.answer()
        await query.message.reply_text("❌ Произошла ошибка при загрузке истории")

async def exercises_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик кнопки упражнений"""
    query = update.callback_query
    user = update.effective_user
    telegram_id = user.id
    
    logger.info(f"💪 User {user.first_name} requested exercises")
    
    # Обновляем время последней активности
    if telegram_id in user_stats:
        user_stats[telegram_id]['last_activity'] = datetime.now().isoformat()
    
    exercises_text = f"""
💪 *Упражнения*

📋 *Базовые упражнения (10 шт):*
1. Жим лежа - грудь 🏋️‍♂️
2. Приседания со штангой - ноги 🦵
3. Становая тяга - спина 🏋️‍♂️
4. Подтягивания - спина 🏋️‍♂️
5. Армейский жим - плечи 💪
6. Бицепс со штангой - руки 💪
7. Трицепс на блоке - руки 💪
8. Сгибания ног - ноги 🦵
9. Гиперэкстензия - спина 🏋️‍♂️
10. Скручивания - пресс 🏋️‍♂️

➕ *Добавь свои упражнения* в приложении!

🚀 *Начни тренировку:*
Нажми "� Открыть Фитнес-Трекер" ниже.

📊 *Статистика упражнений:*
• Базовых: 10 упражнений
• Пользовательских: {user_stats.get(telegram_id, {}).get('custom_exercises', 0)}
• Всего доступно: {10 + user_stats.get(telegram_id, {}).get('custom_exercises', 0)}

💡 *Совет:*
Начни с базовых упражнений для безопасного старта!
    """
    
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            text="🚀 Открыть Фитнес-Трекер",
            web_app=WebAppInfo(
                url=MINI_APP_URL,
                title="🏋️‍♂️ Фитнес-Трекер",
                description="Открыть приложение",
                text="Открыть"
            )
        )],
        [InlineKeyboardButton(
            text="➕ Добавить упражнение",
            callback_data="add_exercise"
        )],
        [InlineKeyboardButton(
            text="🔙 Назад",
            callback_data="back_to_menu"
        )]
    ])
    
    try:
        await query.answer()
        await query.edit_message_text(
            exercises_text,
            reply_markup=keyboard,
            parse_mode='Markdown'
        )
        logger.info(f"✅ Exercises sent to user {telegram_id}")
    except Exception as e:
        logger.error(f"❌ Error sending exercises: {e}")
        await query.answer()
        await query.message.reply_text("❌ Произошла ошибка при загрузке упражнений")

async def help_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик кнопки помощи"""
    query = update.callback_query
    user = update.effective_user
    telegram_id = user.id
    
    logger.info(f"ℹ️ User {user.first_name} requested help")
    
    # Обновляем время последней активности
    if telegram_id in user_stats:
        user_stats[telegram_id]['last_activity'] = datetime.now().isoformat()
    
    help_text = f"""
ℹ️ *Помощь по Фитнес-Трекеру*

📱 *Mini App возможности:*
• 🏋️‍♂️ Отслеживание тренировок в Telegram
• 💪 Выбор из 10 базовых упражнений
• ➕ Добавление своих упражнений
• 📷 Загрузка фотографий упражнений
• 📊 Личная статистика
• 📜 История тренировок
• 🔄 Работа с собственным весом
• 🚀 Mini App интеграция

🚀 *Как использовать:*
1. Нажми "� Открыть Фитнес-Трекер"
2. Приложение откроется внутри Telegram
3. Выби упражнение и начни тренировку
4. Записывай подходы и вес
5. Следи за прогрессом!

📊 *Команды бота:*
/start - Главное меню
/stats - Статистика
/history - История
/exercises - Упражнения
/help - Эта справка

🌐 *Техническая информация:*
• Веб-приложение: {MINI_APP_URL}
• Бот: @FitnessTrackerBot
• Разработчик: savkovbohdan
• Версия: Python Mini App Bot v2.0

💡 *Советы:*
• Используй Mini App для максимального удобства!
• Начинай с базовых упражнений
• Записывай прогресс регулярно
• Не забывай про отдых и восстановление

📅 *Твоя активность:*
• Последний визит: {user_stats.get(telegram_id, {}).get('last_activity', 'неизвестно')}
• Зарегистрирован: {user_stats.get(telegram_id, {}).get('started_at', 'неизвестно')}
• Всего сессий: {user_stats.get(telegram_id, {}).get('total_sessions', 0)}
    """
    
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            text="🚀 Открыть Фитнес-Трекер",
            web_app=WebAppInfo(
                url=MINI_APP_URL,
                title="🏋️‍♂️ Фитнес-Трекер",
                description="Открыть приложение",
                text="Открыть"
            )
        )],
        [InlineKeyboardButton(
            text="📞 Связаться с разработчиком",
            url="https://github.com/savkovbohdan/fitness-tracker"
        )],
        [InlineKeyboardButton(
            text="🔙 Назад",
            callback_data="back_to_menu"
        )]
    ])
    
    try:
        await query.answer()
        await query.edit_message_text(
            help_text,
            reply_markup=keyboard,
            parse_mode='Markdown'
        )
        logger.info(f"✅ Help sent to user {telegram_id}")
    except Exception as e:
        logger.error(f"❌ Error sending help: {e}")
        await query.answer()
        await query.message.reply_text("❌ Произошла ошибка при загрузке помощи")

async def refresh_stats_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик кнопки обновления статистики"""
    query = update.callback_query
    user = update.effective_user
    telegram_id = user.id
    
    logger.info(f"🔄 User {user.first_name} requested stats refresh")
    
    # Обновляем время последней активности
    if telegram_id in user_stats:
        user_stats[telegram_id]['last_activity'] = datetime.now().isoformat()
    
    # Имитируем обновление статистики
    user_stats[telegram_id]['total_sessions'] = user_stats.get(telegram_id, {}).get('total_sessions', 0) + 1
    
    await query.answer("🔄 Статистика обновлена!")
    # Перенаправляем на stats_callback
    await stats_callback(update, context)

async def refresh_history_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик кнопки обновления истории"""
    query = update.callback_query
    user = update.effective_user
    telegram_id = user.id
    
    logger.info(f"🔄 User {user.first_name} requested history refresh")
    
    # Обновляем время последней активности
    if telegram_id in user_stats:
        user_stats[telegram_id]['last_activity'] = datetime.now().isoformat()
    
    await query.answer("🔄 История обновлена!")
    # Перенаправляем на history_callback
    await history_callback(update, context)

async def add_exercise_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик кнопки добавления упражнения"""
    query = update.callback_query
    user = update.effective_user
    telegram_id = user.id
    
    logger.info(f"➕ User {user.first_name} wants to add exercise")
    
    # Обновляем время последней активности
    if telegram_id in user_stats:
        user_stats[telegram_id]['last_activity'] = datetime.now.now().isoformat()
        user_stats[telegram_id]['custom_exercises'] = user_stats.get(telegram_id, {}).get('custom_exercises', 0) + 1
    
    await query.answer("➕ Функция добавления упражнения доступна в веб-приложении!")
    
    add_exercise_text = """
➕ *Добавление упражнения*

📝 *Как добавить:*
1. Нажми "🚪 Открыть Фитнес-Трекер"
2. Перейди в раздел "Упражнения"
3. Нажми "➕ Добавить упражнение"
4. Введи название и категорию
5. Загрузи фото (опционально)
6. Сохрани упражнение

💪 *Твои упражнения:*
• Количество: {user_stats.get(telegram_id, {}).get('custom_exercises', 0)}
• Можно добавить неограниченное количество
• Фото для визуализации
• Персональная категоризация

🚀 *Начни прямо сейчас!*
Нажми "🚪 Открыть Фитнес-Трекер" ниже!
    """
    
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            text="🚀 Открыть Фитнес-Трекер",
            web_app=WebAppInfo(
                url=MINI_APP_URL,
                title="🏋️‍♂️ Фитнес-Трекер",
                description="Открыть приложение",
                text="Открыть"
            )
        )],
        [InlineKeyboardButton(
            text="🔙 Назад",
            callback_data="back_to_menu"
        )]
    ])
    
    try:
        await query.edit_message_text(
            add_exercise_text,
            reply_markup=keyboard,
            parse_mode='Markdown'
        )
        logger.info(f"✅ Add exercise info sent to user {telegram_id}")
    except Exception as e:
        logger.error(f"❌ Error sending add exercise info: {e}")
        await query.message.reply_text("❌ Произошла ошибка при загрузке информации")

async def back_to_menu_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик кнопки возврата в меню"""
    query = update.callback_query
    user = update.effective_user
    telegram_id = user.id
    
    logger.info(f"🔙 User {user.first_name} returned to menu")
    
    # Обновляем время последней активности
    if telegram_id in user_stats:
        user_stats[telegram_id]['last_activity'] = datetime.now().isoformat()
    
    welcome_text = f"""
🏋️‍♂️ Добро пожаловать в Фитнес-Трекер, {user.first_name}!

📱 *Основные возможности:*
• 📊 Отслеживание тренировок
• 💪 Выбор упражнений (10 базовых + свои)
• 📈 Личная статистика
• 📜 История тренировок
• ➕ Добавление своих упражнений
• 📷 Загрузка фотографий
• 🔄 Работа с собственным весом
• 🚀 Mini App интеграция

🚀 *Начни прямо сейчас:*
Нажми кнопку ниже чтобы открыть приложение!

📱 *Mini App откроется прямо в Telegram!*

📊 *Твоя активность:*
• Всего сессий: {user_stats.get(telegram_id, {}).get('total_sessions', 0)}
• Последняя активность: {user_stats.get(telegram_id, {}).get('last_activity', 'неизвестно')}
• Зарегистрирован: {user_stats.get(telegram_id, {}).get('started_at', 'неизвестно')}
    """
    
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            text="🚀 Открыть Фитнес-Трекер",
            web_app=WebAppInfo(
                url=MINI_APP_URL,
                title="🏋️‍♂️ Фитнес-Трекер",
                description="Полнофункциональное приложение",
                text="Открыть"
            )
        )],
        [InlineKeyboardButton(
            text="📊 Моя статистика",
            callback_data="stats"
        )],
        [InlineKeyboardButton(
            text="📜 История тренировок",
            callback_data="history"
        )],
        [InlineKeyboardButton(
            text="💪 Упражнения",
            callback_data="exercises"
        )],
        [InlineKeyboardButton(
            text="ℹ️ Помощь",
            callback_data="help"
        )]
    ])
    
    try:
        await query.answer()
        await query.edit_message_text(
            welcome_text,
            reply_markup=keyboard,
            parse_mode='Markdown'
        )
        logger.info(f"✅ Main menu sent to user {telegram_id}")
    except Exception as e:
        logger.error(f"❌ Error sending main menu: {e}")
        await query.answer()
        await query.message.reply_text("🏋️‍♂️ Фитнес-Трекер\n\nИспользуй кнопки ниже для навигации.")

async def message_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик текстовых сообщений"""
    user = update.effective_user
    telegram_id = user.id
    message_text = update.message.text
    
    logger.info(f"💬 Received message from {user.first_name}: '{message_text}'")
    
    # Обновляем время последней активности
    if telegram_id in user_stats:
        user_stats[telegram_id]['last_activity'] = datetime.now().isoformat()
    
    # Обработка специальных команд
    if message_text.lower() in ['привет', 'hello', 'hi', 'здравствуй', 'хай']:
        await update.message.reply_text(
            f"Привет, {user.first_name}! 👋\n\n"
            "🏋️‍♂️ Добро пожаловать в Фитнес-Трекер!\n\n"
            "Используй кнопки ниже для навигации по приложению.",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton(
                    text="🚀 Открыть Фитнес-Трекер",
                    web_app=WebAppInfo(
                        url=MINI_APP_URL,
                        title="🏋️‍♂️ Фитнес-Трекер",
                        description="Открыть приложение",
                        text="Открыть"
                    )
                )]
            ])
        )
    elif message_text.lower() in ['статистика', 'stats', '📊']:
        await stats_callback(update, context)
    elif message_text.lower() in ['история', 'history', '📜']:
        await history_callback(update, context)
    elif message_text.lower() in ['упражнения', 'exercises', '💪']:
        await exercises_callback(update, context)
    elif message_text.lower() in ['помощь', 'help', 'ℹ️']:
        await help_callback(update, context)
    else:
        await update.message.reply_text(
            f"📨 Я получил твое сообщение: '{message_text}'\n\n"
            "🏋️‍♂️ Используй кнопки ниже для навигации по приложению:\n"
            "• /start - Главное меню\n"
            "• 📊 Моя статистика\n"
            "• 📜 История тренировок\n"
            "• 💪 Упражнения\n"
            "• ℹ️ Помощь",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton(
                    text="🚀 Открыть Фитнес-Трекер",
                    web_app=WebAppInfo(
                        url=MINI_APP_URL,
                        title="🏋️‍♂️ Фитнес-Трекер",
                        description="Открыть приложение",
                        text="Открыть"
                    )
                )]
            ])
        )

def main():
    """Основная функция запуска бота"""
    logger.info("🚀 Starting Python Mini App Telegram Bot v2.0...")
    logger.info(f"🌐 Mini App URL: {MINI_APP_URL}")
    logger.info(f"🔑 Bot Token: {TELEGRAM_BOT_TOKEN[:15]}...")
    
    try:
        # Создаем приложение
        application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
        
        # Добавляем обработчики
        application.add_handler(CommandHandler("start", start))
        application.add_handler(CallbackQueryHandler(stats_callback, pattern="^stats$"))
        application.add_handler(CallbackQueryHandler(history_callback, pattern="^history$"))
        application.add_handler(CallbackQueryHandler(exercises_callback, pattern="^exercises$"))
        application.add_handler(CallbackQueryHandler(help_callback, pattern="^help$"))
        application.add_handler(CallbackQueryHandler(back_to_menu_callback, pattern="^back_to_menu$"))
        application.add_handler(CallbackQueryHandler(refresh_stats_callback, pattern="^refresh_stats$"))
        application.add_handler(CallbackQueryHandler(refresh_history_callback, pattern="^refresh_history$"))
        application.add_handler(CallbackQueryHandler(add_exercise_callback, pattern="^add_exercise$"))
        application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, message_handler))
        
        logger.info("✅ Mini App Bot is ready!")
        logger.info("🤖 Bot is running...")
        
        # Запускаем бота
        application.run_polling()
        
    except Exception as e:
        logger.error(f"❌ Fatal error starting bot: {e}")
        exit(1)

if __name__ == '__main__':
    main()