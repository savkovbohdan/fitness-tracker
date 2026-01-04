import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const StatsScreen = ({ user, onNavigate }) => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      const data = await apiService.getStats(user.id);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Загрузка статистики...</p>
      </div>
    );
  }

  return (
    <div className="slide-up">
      <div className="header">
        <h1>📈 Статистика</h1>
        <p>Твой прогресс</p>
      </div>

      {stats.length === 0 ? (
        <div className="stats-item">
          <p style={{ textAlign: 'center', opacity: 0.7 }}>
            Нет данных для статистики
          </p>
        </div>
      ) : (
        stats.map((stat, index) => (
          <div key={index} className="stats-item">
            <div className="stats-exercise">💪 {stat.name}</div>
            <div className="stats-details">
              • Всего подходов: {stat.total_sets}<br />
              • Всего повторений: {stat.total_reps}<br />
              • Макс. повторений: {stat.max_reps}<br />
              {stat.max_weight > 0 && (
                <>
                  • Макс. вес: {stat.max_weight} кг<br />
                  • Средний вес: {stat.avg_weight ? stat.avg_weight.toFixed(1) : 0} кг
                </>
              )}
            </div>
          </div>
        ))
      )}

      <button className="btn btn-secondary" onClick={() => onNavigate('main')}>
        ← Назад
      </button>
    </div>
  );
};

export default StatsScreen;
