#!/bin/bash

# Быстрое развертывание Фитнес-Трекера
echo "🚀 Быстрое развертывание..."

# Обновление системы
apt update && apt upgrade -y

# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Установка PM2
npm install -g pm2

# Создание директории
mkdir -p /var/www/fitness-tracker
cd /var/www/fitness-tracker

# Создание package.json
cat > package.json << 'EOF'
{
  "name": "fitness-tracker",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2"
  }
}
EOF

# Создание server.js
cat > server.js << 'EOF'
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./fitness.db', (err) => {
    if (err) {
        console.error('Error:', err.message);
    } else {
        console.log('Connected to SQLite');
        initDB();
    }
});

function initDB() {
    db.run(\`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER UNIQUE,
        username TEXT,
        first_name TEXT
    )\`);
    
    db.run(\`CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        is_custom INTEGER DEFAULT 0
    )\`);
    
    db.run(\`CREATE TABLE IF NOT EXISTS workout_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        exercise_id INTEGER NOT NULL,
        set_number INTEGER NOT NULL,
        weight REAL NOT NULL,
        reps INTEGER NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )\`);
    
    db.get("SELECT COUNT(*) as count FROM exercises", [], (err, row) => {
        if (!err && row && row.count === 0) {
            const exercises = [
                ['Жим лежа', 'грудь', 0],
                ['Приседания со штангой', 'ноги', 0],
                ['Становая тяга', 'спина', 0],
                ['Подтягивания', 'спина', 0],
                ['Армейский жим', 'плечи', 0],
                ['Бицепс со штангой', 'руки', 0],
                ['Трицепс на блоке', 'руки', 0],
                ['Сгибания ног в тренажере', 'ноги', 0],
                ['Гиперэкстензия', 'спина', 0],
                ['Скручивания', 'пресс', 0]
            ];
            
            const stmt = db.prepare("INSERT INTO exercises (name, category, is_custom) VALUES (?, ?, ?)");
            exercises.forEach(ex => stmt.run(ex));
            stmt.finalize();
        }
    });
}

app.post('/api/users', (req, res) => {
    const { telegram_id, username, first_name } = req.body;
    db.run('INSERT OR IGNORE INTO users (telegram_id, username, first_name) VALUES (?, ?, ?)', 
        [telegram_id, username, first_name], 
        function(err) {
            if (err) return res.status(500).json({error: err.message});
            if (this.lastID) {
                res.json({id: this.lastID, telegram_id, username, first_name});
            } else {
                db.get('SELECT * FROM users WHERE telegram_id = ?', [telegram_id], (err, row) => {
                    if (err) return res.status(500).json({error: err.message});
                    res.json(row);
                });
            }
        }
    );
});

app.get('/api/exercises', (req, res) => {
    db.all('SELECT * FROM exercises ORDER BY is_custom, name', (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

app.post('/api/workout-logs', (req, res) => {
    const { user_id, exercise_id, set_number, weight, reps } = req.body;
    db.run('INSERT INTO workout_logs (user_id, exercise_id, set_number, weight, reps) VALUES (?, ?, ?, ?, ?)', 
        [user_id, exercise_id, set_number, weight, reps], 
        function(err) {
            if (err) return res.status(500).json({error: err.message});
            res.json({id: this.lastID});
        }
    );
});

app.get('/api/workout-logs/:user_id', (req, res) => {
    const { user_id } = req.params;
    db.all(\`SELECT wl.*, e.name as exercise_name FROM workout_logs wl JOIN exercises e ON wl.exercise_id = e.id WHERE wl.user_id = ? ORDER BY wl.date DESC LIMIT 20\`, 
        [user_id], 
        (err, rows) => {
            if (err) return res.status(500).json({error: err.message});
            res.json(rows);
        }
    );
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(\`Server running on port \${PORT}\`);
});
EOF

# Создание public директории и index.html
mkdir -p public
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Фитнес-Трекер</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #10b981; color: white; min-height: 100vh; }
        .container { max-width: 400px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 30px 0; background: rgba(255,255,255,0.1); border-radius: 20px; margin-bottom: 20px; }
        .btn { background: #34d399; border: none; padding: 15px; border-radius: 12px; color: white; cursor: pointer; width: 100%; margin: 10px 0; }
        .btn:hover { background: #22c55e; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏋️‍♂️ Фитнес-Трекер</h1>
            <p id="welcome">Загрузка...</p>
        </div>
        <button class="btn" onclick="showExercises()">💪 Упражнения</button>
        <button class="btn" onclick="showHistory()">📊 История</button>
    </div>
    <script>
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.expand();
            tg.ready();
            const user = tg.initDataUnsafe?.user;
            if (user) {
                document.getElementById('welcome').textContent = \`Привет, \${user.first_name}!\`;
            }
        }
        async function showExercises() {
            const res = await fetch('/api/exercises');
            const exercises = await res.json();
            alert('Упражнений: ' + exercises.length);
        }
        async function showHistory() {
            alert('История тренировок');
        }
    </script>
</body>
</html>
EOF

# Установка зависимостей
npm install

# Установка прав
chown -R www-data:www-data /var/www/fitness-tracker
chmod -R 755 /var/www/fitness-tracker

# Установка Nginx
apt install -y nginx

# Конфигурация Nginx
cat > /etc/nginx/sites-available/fitness << 'EOF'
server {
    listen 80;
    server_name _;
    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
EOF

ln -sf /etc/nginx/sites-available/fitness /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx
systemctl enable nginx

# Настройка файрвола
ufw allow 5001
ufw allow 22
ufw --force enable

# Запуск приложения
pm2 start server.js --name fitness-tracker
pm2 startup
pm2 save

echo "✅ Готово! Приложение доступно: http://$(curl -s ifconfig.me)"
EOF
