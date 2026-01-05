const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Используем переменные окружения
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8386581272:AAEL5k6Kxx1ZDN2jeoONNRbe1NKdPwEZe8M';
const WEBAPP_URL = process.env.WEBAPP_URL || 'http://178.212.12.73';

console.log('🤖 Starting Telegram Bot...');
console.log('🌐 Web App URL:', WEBAPP_URL);
console.log('🔑 Bot Token:', BOT_TOKEN.substring(0, 15) + '...');

const bot = new TelegramBot(BOT_TOKEN);

// Проверка подключения к Telegram API
bot.getMe()
  .then((botInfo) => {
    console.log('✅ Bot connected successfully:', botInfo.username);
  })
  .catch((error) => {
    console.error('❌ Bot connection failed:', error.message);
    process.exit(1);
  });

// Логирование всех сообщений
bot.on('message', (msg) => {
  console.log('📨 Received message:', {
    chatId: msg.chat.id,
    text: msg.text,
    from: msg.from.first_name,
    date: new Date(msg.date * 1000).toISOString()
  });
});

// Логирование всех callback запросов
bot.on('callback_query', (query) => {
  console.log('🔘 Received callback:', {
    chatId: query.message.chat.id,
    data: query.data,
    from: query.from.first_name
  });
});

// Команды бота
bot.onText(/\/start/, async (msg) => {
  console.log('📨 Received /start command from:', msg.chat.id);
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name;
  
  const welcomeMessage = `
🏋️‍♂️ Добро пожаловать в Фитнес-Трекер, ${firstName}!

📱 *Основные команды:*
/start - Показать это меню
/app - Открыть веб-приложение
/stats - Моя статистика
/history - История тренировок
/exercises - Упражнения
/help - Помощь

🚀 *Начни прямо сейчас:*
Нажми /app чтобы открыть приложение!
  `;
  
  try {
    await bot.sendMessage(chatId, welcomeMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } },
            { text: '📊 Моя статистика', callback_data: 'stats' }
          ],
          [
            { text: '📜 История тренировок', callback_data: 'history' },
            { text: '💪 Упражнения', callback_data: 'exercises' }
          ],
          [
            { text: 'ℹ️ Помощь', callback_data: 'help' }
          ]
        ]
      }
    });
    console.log('✅ /start command sent successfully to:', chatId);
  } catch (error) {
    console.error('❌ Error sending /start message:', error.message);
  }
});

bot.onText(/\/app/, async (msg) => {
  const chatId = msg.chat.id;
  
  await bot.sendMessage(chatId, '📱 Открываю веб-приложение...', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚀 Открыть Фитнес-Трекер', web_app: { url: WEBAPP_URL } }]
      ]
    }
  });
});

bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = chatId; // Используем chat_id как user_id
  
  try {
    const response = await axios.get(`${WEBAPP_URL}/api/stats/${userId}`);
    const stats = response.data;
    
    let statsMessage = `📊 *Твоя статистика*\n\n`;
    statsMessage += `🏋️‍♂️ Всего тренировок: ${stats.total_workouts || 0}\n`;
    statsMessage += `💪 Уникальных упражнений: ${stats.unique_exercises || 0}\n`;
    statsMessage += `🔢 Всего повторений: ${stats.total_reps || 0}\n`;
    statsMessage += `⚖️ Максимальный вес: ${stats.max_weight || 0} кг\n`;
    statsMessage += `📈 Средний вес: ${stats.avg_weight ? stats.avg_weight.toFixed(1) : 0} кг\n\n`;
    
    if (stats.exercise_stats && stats.exercise_stats.length > 0) {
      statsMessage += `🏋️ *Топ упражнения:*\n`;
      stats.exercise_stats.slice(0, 5).forEach((ex, index) => {
        statsMessage += `${index + 1}. ${ex.name} - ${ex.total_sets} подходов, ${ex.total_reps} повторений\n`;
      });
    }
    
    await bot.sendMessage(chatId, statsMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } }]
        ]
      }
    });
  } catch (error) {
    await bot.sendMessage(chatId, '❌ Не удалось загрузить статистику. Попробуйте позже.');
  }
});

bot.onText(/\/history/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = chatId;
  
  try {
    const response = await axios.get(`${WEBAPP_URL}/api/workout-logs/${userId}`);
    const logs = response.data;
    
    if (logs.length === 0) {
      await bot.sendMessage(chatId, '📜 У тебя пока нет истории тренировок. Начни тренировку прямо сейчас!', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } }]
          ]
        }
      });
      return;
    }
    
    let historyMessage = `📜 *История тренировок*\n\n`;
    historyMessage += `📅 Последние тренировки:\n\n`;
    
    logs.slice(0, 10).forEach((log, index) => {
      historyMessage += `${index + 1}. ${log.exercise_name}\n`;
      historyMessage += `   📅 ${log.date}\n`;
      historyMessage += `   ⚖️ ${log.weight} × ${log.reps}\n\n`;
    });
    
    await bot.sendMessage(chatId, historyMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } }]
        ]
      }
    });
  } catch (error) {
    await bot.sendMessage(chatId, '❌ Не удалось загрузить историю. Попробуйте позже.');
  }
});

bot.onText(/\/exercises/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const response = await axios.get(`${WEBAPP_URL}/api/exercises`);
    const exercises = response.data;
    
    let exercisesMessage = `💪 *Упражнения* (${exercises.length} шт)\n\n`;
    
    exercises.slice(0, 15).forEach((ex, index) => {
      exercisesMessage += `${index + 1}. ${ex.name} (${ex.category})\n`;
    });
    
    if (exercises.length > 15) {
      exercisesMessage += `\n... и еще ${exercises.length - 15} упражнений`;
    }
    
    await bot.sendMessage(chatId, exercisesMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } }]
        ]
      }
    });
  } catch (error) {
    await bot.sendMessage(chatId, '❌ Не удалось загрузить упражнения. Попробуйте позже.');
  }
});

bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  
  const helpMessage = `ℹ️ *Помощь по Фитнес-Трекеру*

📱 *Веб-приложение:*
Полнофункциональное приложение для отслеживания тренировок

🏋️‍♂ *Основные возможности:*
• Выбор упражнения из списка
• Добавление своих упражнений
• Загрузка фотографий упражнений
• Запись подходов (вес, повторения)
• Просмотр истории тренировок
• Персональная статистика
• Работа с собственным весом

📊 *Команды бота:*
/start - Главное меню
/app - Открыть веб-приложение
/stats - Моя статистика
/history - История тренировок
/exercises - Список упражнений
/help - Эта справка

🚀 *Как начать:*
1. Нажми /app для открытия приложения
2. Выбери упражнение из списка
3. Начни тренировку
4. Записывай подходы
5. Следи за прогрессом!

🌐 *Ссылка на приложение:* ${WEBAPP_URL}

💡 *Совет:* Используй веб-приложение для полного функционала!`;
  
  await bot.sendMessage(chatId, helpMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } }]
      ]
    }
  });
});

// Обработка callback кнопок
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  
  if (data === 'stats') {
    await bot.answerCallbackQuery(query.id);
    // Вызываем команду /stats
    bot.sendMessage(chatId, '/stats');
  } else if (data === 'history') {
    await bot.answerCallbackQuery(query.id);
    bot.sendMessage(chatId, '/history');
  } else if (data === 'exercises') {
    await bot.answerCallbackQuery(query.id);
    bot.sendMessage(chatId, '/exercises');
  } else if (data === 'help') {
    await bot.answerCallbackQuery(query.id);
    bot.sendMessage(chatId, '/help');
  }
});

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

bot.on('error', (error) => {
  console.error('Bot error:', error);
});

console.log('🤖 Telegram Bot запущен!');
console.log('🌐 Веб-приложение:', WEBAPP_URL);
