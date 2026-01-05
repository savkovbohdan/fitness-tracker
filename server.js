const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const https = require('https');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = 5001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'fitness_tracker',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function initializeDatabase() {
  try {
    console.log('🔧 Initializing database...');
    
    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id INTEGER UNIQUE,
        username TEXT,
        first_name TEXT
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS exercises (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        is_custom INTEGER DEFAULT 0
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS workout_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        exercise_id INTEGER NOT NULL,
        set_number INTEGER NOT NULL,
        weight REAL NOT NULL,
        reps INTEGER NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('📋 Tables created successfully');

    // Check if exercises exist
    const exercisesResult = await pool.query('SELECT COUNT(*) as count FROM exercises');
    console.log('Exercises count:', exercisesResult.rows[0].count);
    
    if (exercisesResult.rows[0].count === 0) {
      console.log('Creating base exercises...');
      const exercises = [
        ['Жим лежа', 'грудь'], ['Приседания со штангой', 'ноги'],
        ['Становая тяга', 'спина'], ['Подтягивания', 'спина'],
        ['Армейский жим', 'плечи'], ['Бицепс со штангой', 'руки'],
        ['Трицепс на блоке', 'руки'], ['Сгибания ног', 'ноги'],
        ['Гиперэкстензия', 'спина'], ['Скручивания', 'пресс']
      ];

      for (const [name, category] of exercises) {
        console.log(`Adding exercise: ${name} (${category})`);
        const result = await pool.query('INSERT INTO exercises (name, category, is_custom) VALUES ($1, $2, 0)', [name, category]);
        console.log(`Exercise added with ID: ${result.rows[0].id}`);
      }
      console.log('✅ Базовые упражнения добавлены');
    } else {
      console.log('✅ Упражнения уже существуют в базе данных');
    }

    // Add test user
    const userResult = await pool.query('INSERT INTO users (telegram_id, username, first_name) VALUES ($1, $2, $3) ON CONFLICT (telegram_id) DO NOTHING', 
      [12345, 'testuser', 'Test User']);
    console.log('Test user added or already exists');

    console.log('🎯 Database initialization completed successfully');
    
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }
}

// Initialize database on startup
initializeDatabase().then(() => {
  console.log('Database initialization completed');
}).catch(err => {
  console.error('Database initialization failed:', err);
});

app.get('/api/health', (req, res) => {
  res.json({status: 'ok', message: '🏋️‍♂️ Фитнес-Трекер работает!'});
});

app.post('/api/init-db', async (req, res) => {
  try {
    console.log('Force initializing database...');
    await initializeDatabase();
    console.log('Database initialization completed');
    
    // Check exercises count
    const exercisesResult = await pool.query('SELECT COUNT(*) as count FROM exercises');
    console.log('Total exercises after init:', exercisesResult.rows[0].count);
    
    res.json({
      status: 'ok', 
      message: 'Database initialized successfully',
      exercises_count: exercisesResult.rows[0].count
    });
  } catch (err) {
    console.error('Database init error:', err);
    res.status(500).json({error: err.message});
  }
});

app.get('/api/exercises', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM exercises ORDER BY is_custom, name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

app.post('/api/workout-logs', async (req, res) => {
  const { user_id, exercise_id, set_number, weight, reps } = req.body;
  
  if (!user_id || !exercise_id || !set_number || weight === undefined || !reps) {
    return res.status(400).json({error: 'Missing required fields'});
  }

  try {
    const result = await pool.query(
      'INSERT INTO workout_logs (user_id, exercise_id, set_number, weight, reps) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, exercise_id, set_number, weight, reps]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

app.get('/api/workout-logs/:user_id', async (req, res) => {
  const { user_id } = req.params;
  
  try {
    const query = `
      SELECT 
        DATE(wl.date) as workout_date,
        e.name as exercise_name,
        e.category,
        COUNT(*) as total_sets,
        SUM(wl.reps) as total_reps,
        MAX(wl.weight) as max_weight,
        ROUND(AVG(wl.weight)::numeric, 1) as avg_weight,
        STRING_AGG(
          wl.set_number || 'x' || wl.reps || '(' || wl.weight || 'kg)', ', ' ORDER BY wl.set_number
        ) as sets_detail,
        MAX(wl.date) as last_set_time
      FROM workout_logs wl
      JOIN exercises e ON wl.exercise_id = e.id
      WHERE wl.user_id = $1
      GROUP BY DATE(wl.date), e.id, e.name, e.category
      ORDER BY workout_date DESC, last_set_time DESC
    `;
    
    const result = await pool.query(query, [user_id]);
    
    const groupedByDate = {};
    result.rows.forEach(row => {
      const date = row.workout_date;
      if (!groupedByDate[date]) {
        groupedByDate[date] = {
          date: date,
          exercises: [],
          totalSets: 0,
          totalReps: 0
        };
      }
      
      const formattedWeight = row.max_weight === 0 ? 'Собственный вес' : row.max_weight + ' кг';
      
      groupedByDate[date].exercises.push({
        name: row.exercise_name,
        category: row.category,
        totalSets: row.total_sets,
        totalReps: row.total_reps,
        maxWeight: formattedWeight,
        avgWeight: row.avg_weight,
        setsDetail: row.sets_detail,
        lastSetTime: row.last_set_time
      });
      
      groupedByDate[date].totalSets += row.total_sets;
      groupedByDate[date].totalReps += row.total_reps;
    });
    
    const finalResult = Object.values(groupedByDate);
    res.json(finalResult);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function startServer() {
  try {
    console.log('🚀 Starting server and initializing database...');
    await initializeDatabase();
    console.log('✅ Database ready, starting HTTP server...');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 HTTP сервер запущен на порту ${PORT}`);
      console.log(`🌐 http://178.212.12.73:${PORT}`);
      
      // Try to start HTTPS server if certificates exist
      setTimeout(() => {
        try {
          const privateKey = fs.readFileSync('/etc/letsencrypt/live/178.212.12.73/privkey.pem', 'utf8');
          const certificate = fs.readFileSync('/etc/letsencrypt/live/178.212.12.73/cert.pem', 'utf8');
          const ca = fs.readFileSync('/etc/letsencrypt/live/178.212.12.73/chain.pem', 'utf8');
          
          const credentials = { key: privateKey, cert: certificate, ca: ca };
          const httpsServer = https.createServer(credentials, app);
          
          httpsServer.listen(443, '0.0.0.0', () => {
            console.log(`🔒 HTTPS сервер запущен на порту 443`);
            console.log(`🌐 https://178.212.12.73`);
          });
        } catch (err) {
          console.log('📝 SSL сертификаты не найдены, работаем только на HTTP');
          console.log('💡 Для HTTPS установи сертификаты Let\'s Encrypt');
        }
      }, 2000); // Wait 2 seconds for HTTP server to start
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
}

startServer();