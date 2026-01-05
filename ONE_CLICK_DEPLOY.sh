#!/bin/bash
echo "🚀 ОДНОКЛИКОВЫЙ ДЕПЛОЙ ФИТНЕС-ТРЕКЕРА"

# Системное обновление
apt update && apt upgrade -y

# Установка Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Установка PM2
npm install -g pm2

# Создание проекта
mkdir -p /var/www/fitness-tracker
cd /var/www/fitness-tracker

# Package.json
cat > package.json << 'EOF'
{
  "name": "fitness-tracker",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2"
  }
}
EOF

# Server.js
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
app.use(express.static('public'));

const db = new sqlite3.Database('./fitness.db', (err) => {
    console.log(err ? 'DB Error: ' + err : '✅ SQLite connected');
});

// Таблицы
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER UNIQUE,
    username TEXT,
    first_name TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    is_custom INTEGER DEFAULT 0
)`);

db.run(`CREATE TABLE IF NOT EXISTS workout_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    set_number INTEGER NOT NULL,
    weight REAL NOT NULL,
    reps INTEGER NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);

// Базовые упражнения
const exercises = [
    ['Жим лежа', 'грудь'], ['Приседания со штангой', 'ноги'],
    ['Становая тяга', 'спина'], ['Подтягивания', 'спина'],
    ['Армейский жим', 'плечи'], ['Бицепс со штангой', 'руки'],
    ['Трицепс на блоке', 'руки'], ['Сгибания ног', 'ноги'],
    ['Гиперэкстензия', 'спина'], ['Скручивания', 'пресс']
];

db.get("SELECT COUNT(*) as count FROM exercises", [], (err, row) => {
    if (!err && row && row.count === 0) {
        const stmt = db.prepare("INSERT INTO exercises (name, category, is_custom) VALUES (?, ?, 0)");
        exercises.forEach(ex => stmt.run(ex));
        stmt.finalize();
    }
});

// API
app.get('/api/health', (req, res) => res.json({status: 'ok', message: '🏋️‍♂️ Работает!'}));

app.get('/api/exercises', (req, res) => {
    db.all('SELECT * FROM exercises ORDER BY is_custom, name', (err, rows) => {
        res.json(err ? {error: err.message} : rows);
    });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => {
    console.log(`🚀 Сервер на порту ${PORT}`);
    console.log(`🌐 http://$(curl -s ifconfig.me)`);
});
EOF

# Frontend
mkdir -p public
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>🏋️‍♂️ Фитнес-Трекер</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial; background: linear-gradient(135deg, #10b981, #059669); color: white; min-height: 100vh; }
        .container { max-width: 400px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 30px; background: rgba(255,255,255,0.1); border-radius: 20px; margin-bottom: 20px; }
        .menu-item { background: rgba(255,255,255,0.15); border: none; padding: 20px; border-radius: 16px; color: white; font-size: 16px; cursor: pointer; margin: 10px 0; display: block; width: 100%; }
        .menu-item:hover { background: rgba(255,255,255,0.25); }
        .success { background: rgba(52, 211, 153, 0.2); border: 1px solid #34d399; padding: 15px; border-radius: 12px; margin: 10px 0; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏋️‍♂️ Фитнес-Трекер</h1>
            <p id="welcome">Загрузка...</p>
        </div>
        <button class="menu-item" onclick="loadExercises()">💪 Упражнения</button>
        <button class="menu-item" onclick="testAPI()">🔧 Тест API</button>
        <div id="status"></div>
    </div>
    <script>
        const tg = window.Telegram?.WebApp;
        if (tg) { tg.expand(); tg.ready(); }
        
        const user = tg?.initDataUnsafe?.user;
        if (user) document.getElementById('welcome').textContent = `Привет, ${user.first_name}!`;
        
        async function loadExercises() {
            const res = await fetch('/api/exercises');
            const exercises = await res.json();
            alert(`Упражнений: ${exercises.length}`);
        }
        
        async function testAPI() {
            const res = await fetch('/api/health');
            const data = await res.json();
            document.getElementById('status').innerHTML = `<div class="success">✅ ${data.message}</div>`;
        }
    </script>
</body>
</html>
EOF

# Установка зависимостей
npm install

# Права доступа
chown -R www-data:www-data /var/www/fitness-tracker
chmod -R 755 /var/www/fitness-tracker

# Nginx
apt install -y nginx
cat > /etc/nginx/sites-available/fitness << 'EOF'
server {
    listen 80;
    location / { proxy_pass http://localhost:5001; }
}
EOF
ln -sf /etc/nginx/sites-available/fitness /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx && systemctl enable nginx

# Файрвол
ufw allow 5001 && ufw allow 22 && ufw --force enable

# PM2
pm2 start server.js --name fitness-tracker
pm2 startup && pm2 save

# IP адрес
IP=$(curl -s ifconfig.me || echo "178.212.12.73")

echo ""
echo "🎉 ДЕПЛОЙ ЗАВЕРШЕН!"
echo "🌐 http://$IP"
echo "🔗 http://$IP:5001/api/health"
echo ""
echo "🔧 pm2 status fitness-tracker"
EOF
