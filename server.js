const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const https = require('https');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = 5001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'public', 'uploads', 'exercises');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

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
        is_custom INTEGER DEFAULT 0,
        photo_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        ['Жим лежа', 'грудь', 'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif'],
        ['Приседания со штангой', 'ноги', 'https://media.giphy.com/media/3o7aD5dt1i1qS5y4yI/giphy.gif'],
        ['Становая тяга', 'спина', 'https://media.giphy.com/media/3o7aD5dt1i1qS5y4yI/giphy.gif'],
        ['Подтягивания', 'спина', 'https://media.giphy.com/media/3o7aD5dt1i1qS5y4yI/giphy.gif'],
        ['Армейский жим', 'плечи', 'https://media.giphy.com/media/3o7aD5dt1i1qS5y4yI/giphy.gif'],
        ['Бицепс со штангой', 'руки', 'https://media.giphy.com/media/3o7aD5dt1i1qS5y4yI/giphy.gif'],
        ['Трицепс на блоке', 'руки', 'https://media.giphy.com/media/3o7aD5dt1i1qS5y4yI/giphy.gif'],
        ['Сгибания ног', 'ноги', 'https://media.giphy.com/media/3o7aD5dt1i1qS5y4yI/giphy.gif'],
        ['Гиперэкстензия', 'спина', 'https://media.giphy.com/media/3o7aD5dt1i1qS5y4yI/giphy.gif'],
        ['Скручивания', 'пресс', 'https://media.giphy.com/media/3o7aD5dt1i1qS5y4yI/giphy.gif']
      ];

      for (const [name, category, photo_url] of exercises) {
        console.log(`Adding exercise: ${name} (${category})`);
        const result = await pool.query('INSERT INTO exercises (name, category, is_custom, photo_url) VALUES ($1, $2, 0, $3)', [name, category, photo_url]);
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

app.post('/api/upload-exercise-photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({error: 'No file uploaded'});
    }

    // Return the file path that can be stored in database
    const photoUrl = `/uploads/exercises/${req.file.filename}`;
    
    res.json({
      message: 'Photo uploaded successfully',
      photo_url: photoUrl,
      filename: req.file.filename
    });
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

app.post('/api/exercises', async (req, res) => {
  try {
    const { name, category, photo_url } = req.body;
    
    if (!name || !category) {
        return res.status(400).json({error: 'Name and category are required'});
    }

    // Check if exercise already exists
    const existingExercise = await pool.query('SELECT id FROM exercises WHERE name = $1', [name]);
    if (existingExercise.rows.length > 0) {
      return res.status(409).json({error: 'Exercise with this name already exists'});
    }

    // Add custom exercise
    const result = await pool.query(
      'INSERT INTO exercises (name, category, is_custom, photo_url) VALUES ($1, $2, 1, $3) RETURNING *',
      [name, category, photo_url || null]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

app.get('/api/exercises/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Get user's custom exercises only
    const result = await pool.query(
      'SELECT * FROM exercises WHERE is_custom = 1 ORDER BY created_at DESC'
    );
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

app.get('/api/stats/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Get user's workout statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_workouts,
        COUNT(DISTINCT exercise_id) as unique_exercises,
        SUM(reps) as total_reps,
        MAX(weight) as max_weight,
        AVG(weight) as avg_weight
      FROM workout_logs 
      WHERE user_id = $1
    `;
    
    const statsResult = await pool.query(statsQuery, [user_id]);
    const stats = statsResult.rows[0];
    
    // Get exercise-specific stats
    const exerciseStatsQuery = `
      SELECT 
        e.name,
        COUNT(*) as total_sets,
        MAX(wl.weight) as max_weight,
        AVG(wl.weight) as avg_weight,
        SUM(wl.reps) as total_reps
      FROM workout_logs wl
      JOIN exercises e ON wl.exercise_id = e.id
      WHERE wl.user_id = $1
      GROUP BY e.id, e.name, e.category
      ORDER BY total_sets DESC
    `;
    
    const exerciseStatsResult = await pool.query(exerciseStatsQuery, [user_id]);
    
    res.json({
      total_workouts: stats.total_workouts,
      unique_exercises: stats.unique_exercises,
      total_reps: stats.total_reps,
      max_weight: stats.max_weight,
      avg_weight: stats.avg_weight,
      exercise_stats: exerciseStatsResult.rows
    });
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

app.get('/api/workout-logs/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    
    const query = `
      SELECT 
        wl.*, 
        e.name as exercise_name,
        e.category,
        STRING_AGG(
          wl.set_number || '1' || 'x' || wl.reps || '(' || wl.weight || 'kg)' ORDER BY wl.set_number
        ) as sets_detail,
        MAX(wl.date) as last_set_time
      FROM workout_logs wl
      JOIN exercises e ON wl.exercise_id = e.id
      WHERE wl.user_id = $1
      ORDER BY wl.date DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [user_id, limit]);
    
    // Format results for frontend
    const formattedRows = result.rows.map(row => ({
      ...row,
      weight: row.weight === 0 ? 'Собственный вес' : row.weight,
      date: new Date(row.date).toLocaleString('ru-RU')
    }));
    
    res.json(formattedRows);
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