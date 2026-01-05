#!/bin/bash

# Скрипт развертывания Фитнес-Трекера на Ubuntu
# Запускать на сервере с правами root

set -e

echo "🚀 Начинаю развертывание Фитнес-Трекера..."

# Обновление системы
echo "📦 Обновление системы..."
apt update && apt upgrade -y

# Установка Node.js 18.x
echo "📦 Установка Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Проверка версии Node.js
echo "✅ Node.js версия:"
node --version

# Установка PM2 для управления процессами
echo "📦 Установка PM2..."
npm install -g pm2

# Создание директории для приложения
echo "📁 Создание директории приложения..."
mkdir -p /var/www/fitness-tracker
cd /var/www/fitness-tracker

# Копирование файлов приложения (предполагаем что файлы уже загружены)
echo "📋 Подготовка файлов приложения..."

# Создание package.json если нет
if [ ! -f package.json ]; then
    echo "📝 Создание package.json..."
    cat > package.json << 'EOF'
{
  "name": "fitness-tracker-react",
  "version": "1.0.0",
  "description": "React Fitness Tracker with SQLite3 backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2",
    "dotenv": "^16.3.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF
fi

# Создание server.js если нет
if [ ! -f server.js ]; then
    echo "📝 Создание server.js..."
    cat > server.js << 'EOF'
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Database initialization
const db = new sqlite3.Database('./fitness_tracker.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        initializeDatabase();
    }
});

function initializeDatabase() {
    // Users table
    db.run(\`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER UNIQUE,
        username TEXT,
        first_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )\`);

    // Exercises table
    db.run(\`CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        photo_path TEXT,
        is_custom INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )\`);

    // Workout logs table
    db.run(\`CREATE TABLE IF NOT EXISTS workout_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        exercise_id INTEGER NOT NULL,
        set_number INTEGER NOT NULL,
        weight REAL NOT NULL,
        reps INTEGER NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (exercise_id) REFERENCES exercises (id)
    )\`);

    // Add basic exercises if empty
    db.get("SELECT COUNT(*) as count FROM exercises", [], (err, row) => {
        if (err) {
            console.error('Error checking exercises:', err);
            return;
        }
        
        if (row && row.count === 0) {
            const basicExercises = [
                ['Жим лежа', 'грудь', null, 0],
                ['Приседания со штангой', 'ноги', null, 0],
                ['Становая тяга', 'спина', null, 0],
                ['Подтягивания', 'спина', null, 0],
                ['Армейский жим', 'плечи', null, 0],
                ['Бицепс со штангой', 'руки', null, 0],
                ['Трицепс на блоке', 'руки', null, 0],
                ['Сгибания ног в тренажере', 'ноги', null, 0],
                ['Гиперэкстензия', 'спина', null, 0],
                ['Скручивания', 'пресс', null, 0]
            ];

            const stmt = db.prepare("INSERT INTO exercises (name, category, photo_path, is_custom) VALUES (?, ?, ?, ?)");
            basicExercises.forEach(exercise => {
                stmt.run(exercise);
            });
            stmt.finalize();
            console.log('Basic exercises added to database');
        }
    });
}

// API Routes
app.post('/api/users', (req, res) => {
    const { telegram_id, username, first_name } = req.body;
    
    db.run(
        'INSERT OR IGNORE INTO users (telegram_id, username, first_name) VALUES (?, ?, ?)',
        [telegram_id, username, first_name],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            if (this.lastID) {
                res.json({ id: this.lastID, telegram_id, username, first_name });
            } else {
                db.get(
                    'SELECT * FROM users WHERE telegram_id = ?',
                    [telegram_id],
                    (err, row) => {
                        if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                        }
                        res.json(row);
                    }
                );
            }
        }
    );
});

app.get('/api/exercises', (req, res) => {
    db.all(
        'SELECT * FROM exercises ORDER BY is_custom, name',
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        }
    );
});

app.post('/api/workout-logs', (req, res) => {
    const { user_id, exercise_id, set_number, weight, reps } = req.body;
    
    db.run(
        'INSERT INTO workout_logs (user_id, exercise_id, set_number, weight, reps) VALUES (?, ?, ?, ?, ?)',
        [user_id, exercise_id, set_number, weight, reps],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID, user_id, exercise_id, set_number, weight, reps });
        }
    );
});

app.get('/api/workout-logs/:user_id', (req, res) => {
    const { user_id } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    
    db.all(
        \`SELECT wl.*, e.name as exercise_name 
         FROM workout_logs wl
         JOIN exercises e ON wl.exercise_id = e.id
         WHERE wl.user_id = ?
         ORDER BY wl.date DESC
         LIMIT ?\`,
        [user_id, limit],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        }
    );
});

app.get('/api/stats/:user_id', (req, res) => {
    const { user_id } = req.params;
    
    db.all(
        \`SELECT e.name, COUNT(*) as total_sets, 
                SUM(wl.reps) as total_reps,
                MAX(wl.weight) as max_weight,
                MAX(wl.reps) as max_reps,
                AVG(wl.weight) as avg_weight
         FROM workout_logs wl
         JOIN exercises e ON wl.exercise_id = e.id
         WHERE wl.user_id = ?
         GROUP BY e.name\`,
        [user_id],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        }
    );
});

// Serve React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(\`🚀 Server running on port \${PORT}\`);
    console.log(\`🔗 API: http://localhost:\${PORT}/api\`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\\n🛑 Shutting down gracefully...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});
EOF
fi

# Создание public директории и index.html
echo "📁 Создание public директории..."
mkdir -p public

if [ ! -f public/index.html ]; then
    echo "📝 Создание index.html..."
    cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#10b981" />
    <title>Фитнес-Трекер</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            min-height: 100vh;
            color: white;
        }
        .container { max-width: 400px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 30px 0; background: rgba(255,255,255,0.1); border-radius: 20px; margin-bottom: 20px; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
        .stat-card { background: rgba(255,255,255,0.15); padding: 20px; border-radius: 16px; text-align: center; }
        .stat-number { font-size: 32px; font-weight: 700; margin-bottom: 5px; }
        .stat-label { font-size: 12px; opacity: 0.8; }
        .menu-grid { display: grid; gap: 15px; }
        .menu-item { background: rgba(255,255,255,0.15); border: none; padding: 20px; border-radius: 16px; color: white; font-size: 16px; cursor: pointer; }
        .menu-item:hover { background: rgba(255,255,255,0.25); }
        .btn { background: linear-gradient(135deg, #34d399 0%, #10b981 100%); border: none; padding: 15px; border-radius: 12px; color: white; cursor: pointer; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏋️‍♂️ Фитнес-Трекер</h1>
            <p id="welcome">Загрузка...</p>
        </div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number" id="totalWorkouts">0</div>
                <div class="stat-label">Тренировок</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="totalExercises">10</div>
                <div class="stat-label">Упражнений</div>
            </div>
        </div>
        <div class="menu-grid">
            <button class="menu-item" onclick="showExercises()">💪 Новая тренировка</button>
            <button class="menu-item" onclick="showHistory()">📊 История</button>
            <button class="menu-item" onclick="showStats()">📈 Статистика</button>
        </div>
    </div>

    <script>
        // Инициализация Telegram Web App
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.expand();
            tg.ready();
            
            const user = tg.initDataUnsafe?.user;
            if (user) {
                document.getElementById('welcome').textContent = \`Привет, \${user.first_name}!\`;
            }
        }

        // API функции
        async function apiCall(endpoint, data = null) {
            const options = {
                method: data ? 'POST' : 'GET',
                headers: { 'Content-Type': 'application/json' }
            };
            if (data) options.body = JSON.stringify(data);
            
            const response = await fetch(\`/api\${endpoint}\`, options);
            return response.json();
        }

        function showExercises() {
            // Здесь будет логика выбора упражнений
            alert('Выбор упражнений');
        }

        function showHistory() {
            // Здесь будет логика истории
            alert('История тренировок');
        }

        function showStats() {
            // Здесь будет логика статистики
            alert('Статистика');
        }
    </script>
</body>
</html>
EOF
fi

# Установка зависимостей
echo "📦 Установка зависимостей Node.js..."
npm install

# Установка прав на директорию
echo "🔧 Установка прав..."
chown -R www-data:www-data /var/www/fitness-tracker
chmod -R 755 /var/www/fitness-tracker

# Создание .env файла
echo "📝 Создание .env файла..."
cat > .env << 'EOF'
NODE_ENV=production
PORT=5001
EOF

# Создание PM2 конфигурации
echo "⚙️ Создание PM2 конфигурации..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'fitness-tracker',
    script: 'server.js',
    cwd: '/var/www/fitness-tracker',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    }
  }]
};
EOF

# Запуск приложения через PM2
echo "🚀 Запуск приложения через PM2..."
pm2 start ecosystem.config.js

# Настройка PM2 автозапуска
echo "🔄 Настройка автозапуска..."
pm2 startup
pm2 save

# Настройка файрвола
echo "🔥 Настройка файрвола..."
ufw allow 5001/tcp
ufw allow 22/tcp
ufw --force enable

# Установка Nginx для reverse proxy
echo "🌐 Установка Nginx..."
apt install -y nginx

# Создание Nginx конфигурации
echo "⚙️ Создание Nginx конфигурации..."
cat > /etc/nginx/sites-available/fitness-tracker << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Активация сайта
ln -sf /etc/nginx/sites-available/fitness-tracker /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Перезапуск Nginx
echo "🔄 Перезапуск Nginx..."
systemctl restart nginx
systemctl enable nginx

# Получение IP адреса сервера
SERVER_IP=$(curl -s ifconfig.me)

echo "✅ Развертывание завершено!"
echo ""
echo "🌐 Приложение доступно по адресам:"
echo "   http://$SERVER_IP"
echo "   http://$SERVER_IP:5001"
echo ""
echo "🔧 Управление процессами:"
echo "   pm2 status          - статус"
echo "   pm2 logs fitness-tracker - логи"
echo "   pm2 restart fitness-tracker - перезапуск"
echo "   pm2 stop fitness-tracker - остановка"
echo ""
echo "📁 Расположение файлов: /var/www/fitness-tracker"
echo "🗄️ База данных: /var/www/fitness-tracker/fitness_tracker.db"
echo ""
echo "🎉 Фитнес-Трекер успешно развернут на сервере!"
EOF
