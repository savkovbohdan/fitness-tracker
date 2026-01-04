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

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'build')));

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
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER UNIQUE,
        username TEXT,
        first_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Exercises table
    db.run(`CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        photo_path TEXT,
        is_custom INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Workout logs table
    db.run(`CREATE TABLE IF NOT EXISTS workout_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        exercise_id INTEGER NOT NULL,
        set_number INTEGER NOT NULL,
        weight REAL NOT NULL,
        reps INTEGER NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (exercise_id) REFERENCES exercises (id)
    )`);

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

// Users
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
                // User already exists, get existing user
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

app.get('/api/users/:telegram_id', (req, res) => {
    const { telegram_id } = req.params;
    
    db.get(
        'SELECT * FROM users WHERE telegram_id = ?',
        [telegram_id],
        (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (!row) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            res.json(row);
        }
    );
});

// Exercises
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

app.post('/api/exercises', (req, res) => {
    const { name, category, photo_path } = req.body;
    
    db.run(
        'INSERT INTO exercises (name, category, photo_path, is_custom) VALUES (?, ?, ?, 1)',
        [name, category, photo_path],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID, name, category, photo_path, is_custom: 1 });
        }
    );
});

// Workout logs
app.get('/api/workout-logs/:user_id', (req, res) => {
    const { user_id } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    
    db.all(
        `SELECT wl.*, e.name as exercise_name 
         FROM workout_logs wl
         JOIN exercises e ON wl.exercise_id = e.id
         WHERE wl.user_id = ?
         ORDER BY wl.date DESC
         LIMIT ?`,
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

// Statistics
app.get('/api/stats/:user_id', (req, res) => {
    const { user_id } = req.params;
    
    db.all(
        `SELECT e.name, COUNT(*) as total_sets, 
                SUM(wl.reps) as total_reps,
                MAX(wl.weight) as max_weight,
                MAX(wl.reps) as max_reps,
                AVG(wl.weight) as avg_weight
         FROM workout_logs wl
         JOIN exercises e ON wl.exercise_id = e.id
         WHERE wl.user_id = ?
         GROUP BY e.name`,
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

// Serve React app for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 React app: http://localhost:3000`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});
