import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const HistoryScreen = ({ user, onNavigate }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    try {
      const data = await apiService.getWorkoutLogs(user.id, 50);
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupHistoryByDate = (history) => {
    const grouped = {};
    
    history.forEach(record => {
      const date = new Date(record.date).toLocaleDateString('ru-RU');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(record);
    });
    
    return grouped;
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Загрузка истории...</p>
      </div>
    );
  }

  const groupedHistory = groupHistoryByDate(history);

  return (
    <div className="slide-up">
      <div className="header">
        <h1>📊 История тренировок</h1>
        <p>Твои последние тренировки</p>
      </div>

      {Object.keys(groupedHistory).length === 0 ? (
        <div className="history-item">
          <p style={{ textAlign: 'center', opacity: 0.7 }}>
            У тебя пока нет тренировок
          </p>
        </div>
      ) : (
        Object.keys(groupedHistory).reverse().map(date => (
          <div key={date} className="history-item">
            <div className="history-date">📅 {date}</div>
            
            {groupedHistory[date].map((record, index) => (
              <div key={record.id} style={{ marginLeft: '10px' }}>
                <div className="history-exercise">
                  💪 {record.exercise_name}
                </div>
                <div className="history-sets">
                  Подход {record.set_number}: {record.reps} повторений 
                  {record.weight === 0 ? ' (свой вес)' : ` (${record.weight} кг)`}
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      <button className="btn btn-secondary" onClick={() => onNavigate('main')}>
        ← Назад
      </button>
    </div>
  );
};

export default HistoryScreen;
