import psycopg2
import os
from datetime import datetime
import uuid

class Database:
    def __init__(self, db_path="fitness_bot.db"):
        self.db_path = db_path
        self.init_db()
    
    def init_db(self):
        """Инициализация базы данных"""
        conn = psycopg2.connect(
            host="localhost",
            database="fitness_tracker",
            user="postgres",
            password="postgres123"
        )
        cursor = conn.cursor()
        
        # Таблица пользователей
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                telegram_id INTEGER UNIQUE NOT NULL,
                username TEXT,
                first_name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Таблица упражнений
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS exercises (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                category TEXT,
                photo_path TEXT,
                is_custom INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Таблица записей тренировок
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS workout_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                exercise_id INTEGER NOT NULL,
                set_number INTEGER NOT NULL,
                weight REAL NOT NULL,
                reps INTEGER NOT NULL,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (exercise_id) REFERENCES exercises (id)
            )
        ''')
        
        # Добавляем базовые упражнения если их нет
        cursor.execute('SELECT COUNT(*) FROM exercises')
        if cursor.fetchone()[0] == 0:
            basic_exercises = [
                ('Жим лежа', 'грудь', None, 0),
                ('Приседания со штангой', 'ноги', None, 0),
                ('Становая тяга', 'спина', None, 0),
                ('Подтягивания', 'спина', None, 0),
                ('Армейский жим', 'плечи', None, 0),
                ('Бицепс со штангой', 'руки', None, 0),
                ('Трицепс на блоке', 'руки', None, 0),
                ('Сгибания ног в тренажере', 'ноги', None, 0),
                ('Гиперэкстензия', 'спина', None, 0),
                ('Скручивания', 'пресс', None, 0)
            ]
            cursor.executemany(
                'INSERT INTO exercises (name, category, photo_path, is_custom) VALUES (?, ?, ?, ?)',
                basic_exercises
            )
        
        conn.commit()
        conn.close()
    
    def get_connection(self):
        """Получить соединение с базой данных"""
        return psycopg2.connect(
            host="localhost",
            database="fitness_tracker",
            user="postgres",
            password="postgres123"
        )
    
    def add_user(self, telegram_id, username=None, first_name=None):
        """Добавить нового пользователя"""
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                'INSERT INTO users (telegram_id, username, first_name) VALUES (?, ?, ?)',
                (telegram_id, username, first_name)
            )
            conn.commit()
            return cursor.lastrowid
        except psycopg2.IntegrityError:
            # Пользователь уже существует
            cursor.execute('SELECT id FROM users WHERE telegram_id = %s', (telegram_id,))
            return cursor.fetchone()[0]
        finally:
            conn.close()
    
    def get_user(self, telegram_id):
        """Получить пользователя по telegram_id"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE telegram_id = ?', (telegram_id,))
        user = cursor.fetchone()
        conn.close()
        return user
    
    def add_custom_exercise(self, name, category, photo_path=None):
        """Добавить пользовательское упражнение"""
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                'INSERT INTO exercises (name, category, photo_path, is_custom) VALUES (?, ?, ?, 1)',
                (name, category, photo_path)
            )
            conn.commit()
            return cursor.lastrowid
        except sqlite3.IntegrityError:
            return None  # Упражнение с таким названием уже существует
        finally:
            conn.close()
    
    def get_exercises(self):
        """Получить все упражнения"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM exercises ORDER BY is_custom, name')
        exercises = cursor.fetchall()
        conn.close()
        return exercises
    
    def add_workout_log(self, user_id, exercise_id, set_number, weight, reps):
        """Добавить запись о подходе"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO workout_logs (user_id, exercise_id, set_number, weight, reps) VALUES (?, ?, ?, ?, ?)',
            (user_id, exercise_id, set_number, weight, reps)
        )
        conn.commit()
        log_id = cursor.lastrowid
        conn.close()
        return log_id
    
    def get_user_workout_history(self, user_id, limit=20):
        """Получить историю тренировок пользователя"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT wl.id, wl.user_id, wl.exercise_id, wl.set_number, wl.weight, wl.reps, wl.date, e.name as exercise_name
            FROM workout_logs wl
            JOIN exercises e ON wl.exercise_id = e.id
            WHERE wl.user_id = ?
            ORDER BY wl.date DESC
            LIMIT ?
        ''', (user_id, limit))
        history = cursor.fetchall()
        conn.close()
        return history
    
    def get_exercise_stats(self, user_id, exercise_id):
        """Получить статистику по конкретному упражнению"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT 
                COUNT(*) as total_sets,
                MAX(weight) as max_weight,
                AVG(weight) as avg_weight
            FROM workout_logs 
            WHERE user_id = ? AND exercise_id = ?
        ''', (user_id, exercise_id))
        stats = cursor.fetchone()
        conn.close()
        return stats
