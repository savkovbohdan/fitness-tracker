import os
import logging
import uuid
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
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

# Состояния пользователя
class UserState:
    WAITING_EXERCISE = "waiting_exercise"
    WAITING_SET_WEIGHT = "waiting_set_weight"
    WAITING_SET_REPS = "waiting_set_reps"
    WAITING_EXERCISE_NAME = "waiting_exercise_name"
    WAITING_EXERCISE_CATEGORY = "waiting_exercise_category"
    WAITING_EXERCISE_PHOTO = "waiting_exercise_photo"
    VIEWING_EXERCISE_DETAILS = "viewing_exercise_details"
    ACTIVE_WORKOUT = "active_workout"

# Глобальное хранилище состояний
user_states = {}

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

Выбери действие:
    """
    
    keyboard = [
        [InlineKeyboardButton("💪 Новая тренировка", callback_data="new_workout")],
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
    
    if action == "new_workout":
        await show_exercises(query, user_id)
    elif action == "add_exercise":
        await start_add_exercise(query, user_id)
    elif action == "history":
        await show_history(query, user_id)
    elif action == "stats":
        await show_stats(query, user_id)
    elif action == "help":
        await show_help(query)
    elif action.startswith("exercise_"):
        exercise_id = action.split("_")[1]
        await select_exercise(query, user_id, exercise_id)
    elif action.startswith("weight_"):
        # Обработка выбора веса
        weight = float(action.split("_")[1])
        user_id = update.effective_user.id
        
        if user_id in user_states and user_states[user_id]['state'] == UserState.WAITING_SET_WEIGHT:
            user_states[user_id]['current_weight'] = weight
            user_states[user_id]['state'] = UserState.WAITING_SET_REPS
            
            if weight == 0:
                await query.edit_message_text(
                    f"💪 {user_states[user_id]['exercise_name']}\n\n"
                    f"Подход {user_states[user_id]['current_set']} - Свой вес\n\n"
                    "Введи количество повторений:"
                )
            else:
                await query.edit_message_text(
                    f"💪 {user_states[user_id]['exercise_name']}\n\n"
                    f"Подход {user_states[user_id]['current_set']} - {weight} кг\n\n"
                    "Введи количество повторений:"
                )
    elif action.startswith("category_"):
        # Обработка выбора категории упражнения
        category = action.split("_")[1]
        user_id = update.effective_user.id
        
        if user_id in user_states and user_states[user_id]['state'] == UserState.WAITING_EXERCISE_CATEGORY:
            user_states[user_id]['exercise_data']['category'] = category
            user_states[user_id]['state'] = UserState.WAITING_EXERCISE_PHOTO
            
            await query.edit_message_text(
                f"Отлично! Категория: *{category}*\n\n"
                "Теперь отправь фото тренажера или напиши «пропустить»:",
                parse_mode='Markdown'
            )
    elif action == "add_set":
        # Добавить еще подход
        user_id = update.effective_user.id
        if user_id in user_states and user_states[user_id]['state'] == UserState.ACTIVE_WORKOUT:
            user_states[user_id]['current_set'] += 1
            user_states[user_id]['state'] = UserState.WAITING_SET_WEIGHT
            
            keyboard = [
                [InlineKeyboardButton("🏃‍♂️ Свой вес", callback_data="weight_0")]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await query.edit_message_text(
                f"💪 {user_states[user_id]['exercise_name']}\n\n"
                f"Подход {user_states[user_id]['current_set']}\n\n"
                "🏃‍♂️ Нажми «Свой вес» если занимаешься без доп. веса\n"
                "или введи вес в кг (например: 20.5):",
                reply_markup=reply_markup
            )
    elif action == "finish_exercise":
        # Завершить упражнение
        user_id = update.effective_user.id
        if user_id in user_states and user_states[user_id]['state'] == UserState.ACTIVE_WORKOUT:
            await finish_exercise(query, user_id)
    elif action.startswith("photo_"):
        # Показать фото упражнения
        exercise_id = action.split("_")[1]
        await show_exercise_photo(query, exercise_id)
    elif action == "back_to_menu":
        await back_to_main_menu(query, user_id)

async def show_exercises(query, user_id):
    """Показать список упражнений"""
    exercises = db.get_exercises()
    
    keyboard = []
    for exercise in exercises:
        emoji = "👤" if exercise[5] == 1 else "💪"  # is_custom поле
        keyboard.append([InlineKeyboardButton(
            f"{emoji} {exercise[1]}", 
            callback_data=f"exercise_{exercise[0]}"
        )])
        # Добавляем кнопку просмотра фото если есть фото
        if exercise[4]:  # photo_path
            keyboard.append([InlineKeyboardButton(
                f"📷 Фото упражнения", 
                callback_data=f"photo_{exercise[0]}"
            )])
    
    keyboard.append([InlineKeyboardButton("🔙 Назад", callback_data="back_to_menu")])
    keyboard.append([InlineKeyboardButton("➕ Добавить упражнение", callback_data="add_exercise")])
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(
        "Выбери упражнение для записи тренировки:",
        reply_markup=reply_markup
    )

async def finish_exercise(query, user_id):
    """Завершить упражнение и показать результаты"""
    state = user_states[user_id]
    
    # Формируем сообщение с результатами
    result_message = f"✅ Тренировка завершена!\n\n"
    result_message += f"Упражнение: {state['exercise_name']}\n"
    result_message += f"Подходов выполнено: {len(state['sets_completed'])}\n\n"
    
    for i, (weight, reps) in enumerate(state['sets_completed'], 1):
        if weight == 0:
            result_message += f"Подход {i}: {reps} повторений (свой вес)\n"
        else:
            result_message += f"Подход {i}: {reps} повторений по {weight} кг\n"
    
    # Сохраняем все подходы в базу данных
    user = db.get_user(user_id)
    for i, (weight, reps) in enumerate(state['sets_completed'], 1):
        db.add_workout_log(
            user[0],  # user_id из базы
            state['exercise_id'],
            i,  # номер подхода
            weight,
            reps
        )
    
    # Предлагаем выбор действия
    keyboard = [
        [InlineKeyboardButton("💪 Еще упражнение", callback_data="new_workout")],
        [InlineKeyboardButton("🏠 Главный экран", callback_data="back_to_menu")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(result_message + "\n\nЧто дальше?", reply_markup=reply_markup)
    
    # Очищаем состояние
    del user_states[user_id]

async def show_exercise_photo(query, exercise_id):
    """Показать фото упражнения"""
    exercises = db.get_exercises()
    exercise = None
    for e in exercises:
        if e[0] == int(exercise_id):
            exercise = e
            break
    
    if not exercise or not exercise[4]:  # photo_path
        await query.answer("У этого упражнения нет фото")
        return
    
    try:
        with open(exercise[4], 'rb') as photo_file:
            await query.message.reply_photo(
                photo=photo_file,
                caption=f"📷 {exercise[1]} ({exercise[3]})",
                reply_markup=InlineKeyboardMarkup([[
                    InlineKeyboardButton("🔙 Назад", callback_data="new_workout")
                ]])
            )
    except Exception as e:
        await query.answer("Не удалось загрузить фото")

async def start_add_exercise(query, user_id):
    """Начать процесс добавления упражнения"""
    user_states[user_id] = {
        'state': UserState.WAITING_EXERCISE_NAME,
        'exercise_data': {}
    }
    
    await query.edit_message_text(
        "➕ **Добавление нового упражнения**\n\n"
        "Введи название упражнения:",
        parse_mode='Markdown'
    )

async def select_exercise(query, user_id, exercise_id):
    """Обработка выбора упражнения"""
    exercises = db.get_exercises()
    exercise = None
    for e in exercises:
        if e[0] == int(exercise_id):
            exercise = e
            break
    
    user_states[user_id] = {
        'state': UserState.WAITING_SET_WEIGHT,
        'exercise_id': int(exercise_id),
        'exercise_name': exercise[1] if exercise else "Неизвестное",
        'sets_completed': [],
        'current_set': 1
    }
    
    # Предлагаем выбор веса
    keyboard = [
        [InlineKeyboardButton("🏃‍♂️ Свой вес", callback_data="weight_0")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(
        f"💪 {user_states[user_id]['exercise_name']}\n\n"
        f"Подход {user_states[user_id]['current_set']}\n\n"
        "🏃‍♂️ Нажми «Свой вес» если занимаешься без доп. веса\n"
        "или введи вес в кг (например: 20.5):",
        reply_markup=reply_markup
    )

async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка фото упражнений"""
    user_id = update.effective_user.id
    
    if user_id not in user_states or user_states[user_id]['state'] != UserState.WAITING_EXERCISE_PHOTO:
        return
    
    # Получаем файл фото
    photo_file = await update.message.photo[-1].get_file()
    
    # Создаем уникальное имя файла
    file_extension = photo_file.file_path.split('.')[-1] if '.' in photo_file.file_path else 'jpg'
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    photo_path = os.path.join("exercise_photos", unique_filename)
    
    # Скачиваем и сохраняем фото
    await photo_file.download_to_drive(photo_path)
    
    # Сохраняем упражнение в базу
    result = db.add_custom_exercise(
        user_states[user_id]['exercise_data']['name'],
        user_states[user_id]['exercise_data']['category'],
        photo_path
    )
    
    if result:
        await update.message.reply_text(
            f"✅ Упражнение *{user_states[user_id]['exercise_data']['name']}* успешно добавлено с фото!\n\n"
            "Теперь оно доступно в списке упражнений для тренировок.",
            parse_mode='Markdown'
        )
    else:
        await update.message.reply_text(
            "❌ Упражнение с таким названием уже существует."
        )
    
    # Очищаем состояние и возвращаем в меню
    del user_states[user_id]
    await back_to_main_menu(update.message, user_id)

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка текстовых сообщений"""
    user_id = update.effective_user.id
    message_text = update.message.text
    
    if user_id not in user_states:
        await update.message.reply_text(
            "Пожалуйста, выбери действие из меню командой /start"
        )
        return
    
    state = user_states[user_id]
    
    if state['state'] == UserState.WAITING_EXERCISE_NAME:
        # Сохраняем название упражнения
        state['exercise_data']['name'] = message_text.strip()
        state['state'] = UserState.WAITING_EXERCISE_CATEGORY
        
        # Показываем категории на выбор
        keyboard = [
            [InlineKeyboardButton("🦵 Ноги", callback_data="category_ноги")],
            [InlineKeyboardButton("💪 Грудь", callback_data="category_грудь")],
            [InlineKeyboardButton("🔙 Спина", callback_data="category_спина")],
            [InlineKeyboardButton("💪 Руки", callback_data="category_руки")],
            [InlineKeyboardButton("🤸 Плечи", callback_data="category_плечи")],
            [InlineKeyboardButton("🎯 Пресс", callback_data="category_пресс")],
            [InlineKeyboardButton("📝 Другое", callback_data="category_другое")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            f"Отлично! Название: *{state['exercise_data']['name']}*\n\n"
            "Теперь выбери категорию:",
            reply_markup=reply_markup,
            parse_mode='Markdown'
        )
    
    elif state['state'] == UserState.WAITING_EXERCISE_CATEGORY:
        # Эта часть обрабатывается в button_callback
        pass
    
    elif state['state'] == UserState.WAITING_EXERCISE_PHOTO:
        if message_text.lower() == 'пропустить':
            photo_path = None
        else:
            # Это должно обрабатываться в обработчике фото
            await update.message.reply_text("Пожалуйста, отправь фото или напиши «пропустить»")
            return
        
        # Сохраняем упражнение в базу
        result = db.add_custom_exercise(
            state['exercise_data']['name'],
            state['exercise_data']['category'],
            photo_path
        )
        
        if result:
            await update.message.reply_text(
                f"✅ Упражнение *{state['exercise_data']['name']}* успешно добавлено!\n\n"
                "Теперь оно доступно в списке упражнений для тренировок.",
                parse_mode='Markdown'
            )
        else:
            await update.message.reply_text(
                "❌ Упражнение с таким названием уже существует."
            )
        
        # Очищаем состояние и возвращаем в меню
        del user_states[user_id]
        await back_to_main_menu(update.message, user_id)
    
    elif state['state'] == UserState.WAITING_SET_WEIGHT:
        # Ввод кастомного веса
        try:
            weight = float(message_text)
            if weight < 0:
                await update.message.reply_text("Вес не может быть отрицательным. Попробуй еще раз:")
                return
            
            state['current_weight'] = weight
            state['state'] = UserState.WAITING_SET_REPS
            
            weight_text = "Свой вес" if weight == 0 else f"{weight} кг"
            await update.message.reply_text(
                f"💪 {state['exercise_name']}\n\n"
                f"Подход {state['current_set']} - {weight_text}\n\n"
                "Введи количество повторений:"
            )
        except ValueError:
            await update.message.reply_text("Пожалуйста, введи число для веса (например: 50 или 50.5):")
    
    elif state['state'] == UserState.WAITING_SET_REPS:
        # Ввод количества повторений
        try:
            reps = int(message_text)
            if reps <= 0:
                await update.message.reply_text("Количество повторений должно быть положительным числом. Попробуй еще раз:")
                return
            
            # Сохраняем подход
            state['sets_completed'].append((state['current_weight'], reps))
            
            # Показываем информацию о выполненном подходе и предлагаем выбор
            weight_text = "свой вес" if state['current_weight'] == 0 else f"{state['current_weight']} кг"
            
            keyboard = [
                [InlineKeyboardButton("➕ Добавить подход", callback_data="add_set")],
                [InlineKeyboardButton("✅ Завершить упражнение", callback_data="finish_exercise")]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await update.message.reply_text(
                f"✅ Подход {state['current_set']} выполнен!\n"
                f"📊 {reps} повторений ({weight_text})\n\n"
                f"Что дальше?",
                reply_markup=reply_markup
            )
            
            # Меняем состояние на активную тренировку
            state['state'] = UserState.ACTIVE_WORKOUT
            
        except ValueError:
            await update.message.reply_text("Пожалуйста, введи целое число для повторений:")

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

🔹 **Новая тренировка** - Выбери упражнение и введи количество подходов и вес
🔹 **История тренировок** - Посмотри последние записи о тренировках
🔹 **Моя статистика** - Увидь свою прогрессию по упражнениям

💡 **Советы:**
• Вводи количество подходов целым числом (например: 3)
• Вес можно вводить с десятичными (например: 50.5)
• Регулярно записывай тренировки для отслеживания прогресса

🏋️‍♂️ Удачи в тренировках!
    """
    
    keyboard = [[InlineKeyboardButton("🔙 Назад", callback_data="back_to_menu")]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(help_text, reply_markup=reply_markup, parse_mode='Markdown')

async def back_to_main_menu(query_or_message, user_id):
    """Возврат в главное меню"""
    keyboard = [
        [InlineKeyboardButton("💪 Новая тренировка", callback_data="new_workout")],
        [InlineKeyboardButton("📊 История тренировок", callback_data="history")],
        [InlineKeyboardButton("📈 Моя статистика", callback_data="stats")],
        [InlineKeyboardButton("ℹ️ Помощь", callback_data="help")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    menu_text = "🏋️‍♂️ Главное меню Фитнес-Трекера:"
    
    if hasattr(query_or_message, 'edit_message_text'):
        await query_or_message.edit_message_text(menu_text, reply_markup=reply_markup)
    else:
        await query_or_message.reply_text(menu_text, reply_markup=reply_markup)

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
    application.add_handler(MessageHandler(filters.PHOTO, handle_photo))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    application.add_error_handler(error_handler)
    
    # Запуск бота
    print("🤖 Фитнес-бот запускается...")
    application.run_polling()

if __name__ == '__main__':
    main()
