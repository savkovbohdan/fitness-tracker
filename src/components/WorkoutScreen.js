import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const WorkoutScreen = ({ user, onNavigate, onWorkoutComplete, exercise: initialExercise }) => {
  const [exercise, setExercise] = useState(initialExercise || null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [currentSets, setCurrentSets] = useState([]);
  const [setNumber, setSetNumber] = useState(1);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    if (!exercise && onNavigate) {
      onNavigate('exercises');
    }
  }, [exercise]);

  const hapticFeedback = () => {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
    }, 3000);
  };

  const addSet = async () => {
    const weightValue = parseFloat(weight) || 0;
    const repsValue = parseInt(reps);

    if (!repsValue || repsValue <= 0) {
      showMessage('Пожалуйста, введи корректное количество повторений', 'error');
      return;
    }

    const newSet = { weight: weightValue, reps: repsValue };
    setCurrentSets([...currentSets, newSet]);
    setSetNumber(setNumber + 1);
    setWeight('');
    setReps('');

    hapticFeedback();
    showMessage(`Подход ${setNumber} добавлен!`, 'success');
  };

  const finishWorkout = async () => {
    if (currentSets.length === 0) {
      showMessage('Добавь хотя бы один подход', 'error');
      return;
    }

    try {
      // Save all sets to database
      for (let i = 0; i < currentSets.length; i++) {
        await apiService.createWorkoutLog(
          user.id,
          exercise.id,
          i + 1,
          currentSets[i].weight,
          currentSets[i].reps
        );
      }

      hapticFeedback();
      
      const resultsText = currentSets.map((set, index) => {
        const weightText = set.weight === 0 ? 'свой вес' : `${set.weight} кг`;
        return `Подход ${index + 1}: ${set.reps} повторений (${weightText})`;
      }).join('\n');

      showMessage(`Тренировка завершена!\n\n${exercise.name}\n${resultsText}`, 'success');

      setTimeout(() => {
        onWorkoutComplete();
        onNavigate('main');
      }, 2000);

    } catch (error) {
      console.error('Error saving workout:', error);
      showMessage('Ошибка сохранения тренировки', 'error');
    }
  };

  if (!exercise) {
    return (
      <div className="loading-screen">
        <p>Загрузка упражнения...</p>
      </div>
    );
  }

  return (
    <div className="slide-up">
      <div className="header">
        <h1>{exercise.name}</h1>
        <p>Подход {setNumber}</p>
      </div>

      {message && (
        <div className={`${messageType}-message`}>
          {message}
        </div>
      )}

      <div className="form-container">
        <div className="form-group">
          <label className="form-label">Вес (кг)</label>
          <input
            type="number"
            className="form-input"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0 для собственного веса"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Повторения</label>
          <input
            type="number"
            className="form-input"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="10"
          />
        </div>

        <button className="btn" onClick={addSet}>
          ✅ Добавить подход
        </button>
        
        <div style={{ marginTop: '20px' }}>
          <button className="btn btn-secondary" onClick={finishWorkout}>
            🏁 Завершить тренировку
          </button>
        </div>
      </div>

      {currentSets.length > 0 && (
        <div className="current-sets">
          <h3 style={{ marginBottom: '10px' }}>Текущие подходы:</h3>
          {currentSets.map((set, index) => (
            <div key={index} className="current-set-item">
              <span>Подход {index + 1}</span>
              <span>
                {set.reps} повторений ({set.weight === 0 ? 'свой вес' : `${set.weight} кг`})
              </span>
            </div>
          ))}
        </div>
      )}

      <button 
        className="btn btn-secondary" 
        onClick={() => onNavigate('exercises')} 
        style={{ marginTop: '20px' }}
      >
        ← Назад
      </button>
    </div>
  );
};

export default WorkoutScreen;
