import os
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes
from dotenv import load_dotenv
from database import Database

# Загрузка переменных окружения
load_dotenv()

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Инициализация базы данных
db = Database()

# URL для Mini App
MINI_APP_URL = "https://your-domain.com/fitness-tracker"  # Замени на свой URL

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /start"""
    user = update.effective_user
    telegram_id = user.id
    
    # Регистрация пользователя в базе данных
    db.add_user(telegram_id, user.username, user.first_name)
    
    welcome_message = f"""
🏋️‍♂️ Добро пожаловать в Фитнес-Трекер, {user.first_name}!

Я помогу тебе вести учет тренировок. Вот что я умею:

📝 Записывать подходы и веса
📊 Показывать историю тренировок
📈 Вести статистику по упражнениям
🎨 Красивый интерфейс Mini App

Выбери действие:
    """
    
    # Создаем клавиатуру с кнопкой Mini App
    keyboard = [
        [InlineKeyboardButton(
            text="🚀 Открыть Фитнес-Трекер",
            web_app=WebAppInfo(url=MINI_APP_URL)
        )],
        [InlineKeyboardButton("📊 История тренировок", callback_data="history")],
        [InlineKeyboardButton("📈 Моя статистика", callback_data="stats")],
        [InlineKeyboardButton("ℹ️ Помощь", callback_data="help")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(welcome_message, reply_markup=reply_markup)

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик нажатий на кнопки"""
    query = update.callback_query
    await query.answer()
    
    user_id = update.effective_user.id
    action = query.data
    
    if action == "history":
        await show_history(query, user_id)
    elif action == "stats":
        await show_stats(query, user_id)
    elif action == "help":
        await show_help(query)
    elif action == "back_to_menu":
        await back_to_main_menu(query, user_id)

async def show_history(query, user_id):
    """Показать историю тренировок"""
    user = db.get_user(user_id)
    history = db.get_user_workout_history(user[0], limit=10)
    
    if not history:
        await query.edit_message_text("У тебя пока нет записей о тренировках. Начни с новой тренировки! 💪")
        return
    
    message = "📊 Твоя история тренировок:\n\n"
    
    # Группируем подходы по дате и упражнению
    grouped_records = {}
    for record in history:
        date_str = record[6].split()[0] if len(record) > 6 and record[6] else "неизвестно"
        exercise_name = record[7] if len(record) > 7 else "неизвестно"
        weight = record[4] if len(record) > 4 else 0
        reps = record[5] if len(record) > 5 else 0
        key = (date_str, exercise_name)
        
        if key not in grouped_records:
            grouped_records[key] = []
        grouped_records[key].append((weight, reps))
    
    for (date_str, exercise_name), sets in grouped_records.items():
        message += f"📅 {date_str}\n"
        message += f"💪 {exercise_name}: {len(sets)} подходов\n"
        
        # Показываем детали каждого подхода
        for i, (weight, reps) in enumerate(sets, 1):
            if weight == 0:
                message += f"  Подход {i}: {reps} повторений (свой вес)\n"
            else:
                message += f"  Подход {i}: {reps} повторений по {weight} кг\n"
        message += "\n"
    
    keyboard = [[InlineKeyboardButton("🔙 Назад", callback_data="back_to_menu")]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(message, reply_markup=reply_markup)

async def show_stats(query, user_id):
    """Показать статистику"""
    user = db.get_user(user_id)
    history = db.get_user_workout_history(user[0], limit=100)
    
    if not history:
        await query.edit_message_text("У тебя пока нет данных для статистики. Начни тренироваться! 💪")
        return
    
    # Группируем по упражнениям
    exercise_stats = {}
    for record in history:
        exercise_name = record[7] if len(record) > 7 else "неизвестно"
        weight = record[4] if len(record) > 4 else 0
        reps = record[5] if len(record) > 5 else 0
        
        if exercise_name not in exercise_stats:
            exercise_stats[exercise_name] = {
                'total_sets': 0,
                'total_reps': 0,
                'total_weight': 0,
                'max_weight': 0,
                'max_reps': 0
            }
        exercise_stats[exercise_name]['total_sets'] += 1
        exercise_stats[exercise_name]['total_reps'] += reps
        exercise_stats[exercise_name]['max_reps'] = max(exercise_stats[exercise_name]['max_reps'], reps)
        
        if weight > 0:  # Учитываем только упражнения с весом
            exercise_stats[exercise_name]['total_weight'] += weight * reps
            exercise_stats[exercise_name]['max_weight'] = max(exercise_stats[exercise_name]['max_weight'], weight)
    
    message = "📈 Твоя статистика:\n\n"
    
    for exercise, stats in exercise_stats.items():
        avg_weight = stats['total_weight'] / stats['total_reps'] if stats['total_reps'] > 0 and stats['total_weight'] > 0 else 0
        message += f"💪 {exercise}:\n"
        message += f"  • Всего подходов: {stats['total_sets']}\n"
        message += f"  • Всего повторений: {stats['total_reps']}\n"
        message += f"  • Макс. повторений: {stats['max_reps']}\n"
        if stats['max_weight'] > 0:
            message += f"  • Макс. вес: {stats['max_weight']} кг\n"
            message += f"  • Средний вес: {avg_weight:.1f} кг\n"
        message += "\n"
    
    keyboard = [[InlineKeyboardButton("🔙 Назад", callback_data="back_to_menu")]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(message, reply_markup=reply_markup)

async def show_help(query):
    """Показать справку"""
    help_text = """
ℹ️ **Помощь по Фитнес-Трекеру**

🔹 **Mini App** - Нажми "🚀 Открыть Фитнес-Трекер" для красивого интерфейса
🔹 **История тренировок** - Посмотри последние записи о тренировках
🔹 **Моя статистика** - Увидь свою прогрессию по упражнениям

💡 **Советы по Mini App:**
• Выбирай упражнения и записывай подходы
• Указывай вес и количество повторений
• Добавляй собственные упражнения
• Смотри историю и статистику

🏋️‍♂️ Удачи в тренировках!
    """
    
    keyboard = [[InlineKeyboardButton("🔙 Назад", callback_data="back_to_menu")]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(help_text, reply_markup=reply_markup, parse_mode='Markdown')

async def back_to_main_menu(query, user_id):
    """Возврат в главное меню"""
    keyboard = [
        [InlineKeyboardButton(
            text="🚀 Открыть Фитнес-Трекер",
            web_app=WebAppInfo(url=MINI_APP_URL)
        )],
        [InlineKeyboardButton("📊 История тренировок", callback_data="history")],
        [InlineKeyboardButton("📈 Моя статистика", callback_data="stats")],
        [InlineKeyboardButton("ℹ️ Помощь", callback_data="help")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    menu_text = "🏋️‍♂️ Главное меню Фитнес-Трекера:"
    
    await query.edit_message_text(menu_text, reply_markup=reply_markup)

async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик ошибок"""
    logger.error(f"Exception while handling an update: {context.error}")

def main():
    """Основная функция запуска бота"""
    token = os.getenv('TELEGRAM_BOT_TOKEN')
    if not token:
        print("Ошибка: TELEGRAM_BOT_TOKEN не найден в переменных окружения!")
        print("Создай файл .env и добавь в него токен бота.")
        return
    
    # Создание приложения
    application = Application.builder().token(token).build()
    
    # Добавление обработчиков
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(button_callback))
    application.add_error_handler(error_handler)
    
    # Запуск бота
    print("🤖 Фитнес-бот с Mini App запускается...")
    print(f"📱 Mini App URL: {MINI_APP_URL}")
    application.run_polling()

if __name__ == '__main__':
    main()
