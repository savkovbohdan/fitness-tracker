import React from 'react';

const MainScreen = ({ user, stats, onNavigate, onStatsUpdate }) => {
  const handleTelegramWebApp = () => {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.openLink('https://your-domain.com/fitness-tracker');
    } else {
      // For local development, navigate to exercises
      onNavigate('exercises');
    }
  };

  return (
    <div className="fade-in">
      <div className="header">
        <h1>🏋️‍♂️ Фитнес-Трекер</h1>
        <p>Привет, {user?.first_name}!</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.totalWorkouts}</div>
          <div className="stat-label">Тренировок</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalExercises}</div>
          <div className="stat-label">Упражнений</div>
        </div>
      </div>

      <div className="menu-grid">
        <button className="menu-item" onClick={() => onNavigate('exercises')}>
          <span>💪 Новая тренировка</span>
          <span className="menu-icon">→</span>
        </button>
        <button className="menu-item" onClick={() => onNavigate('history')}>
          <span>📊 История</span>
          <span className="menu-icon">→</span>
        </button>
        <button className="menu-item" onClick={() => onNavigate('stats')}>
          <span>📈 Статистика</span>
          <span className="menu-icon">→</span>
        </button>
        <button className="menu-item" onClick={() => onNavigate('add-exercise')}>
          <span>➕ Добавить упражнение</span>
          <span className="menu-icon">→</span>
        </button>
      </div>
    </div>
  );
};

export default MainScreen;
