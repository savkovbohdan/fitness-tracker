import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const ExercisesScreen = ({ user, onNavigate, onWorkoutComplete }) => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const data = await apiService.getExercises();
      setExercises(data);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const startWorkout = (exercise) => {
    // Pass exercise data to workout screen
    onNavigate('workout', { exercise });
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Загрузка упражнений...</p>
      </div>
    );
  }

  return (
    <div className="slide-up">
      <div className="header">
        <h1>💪 Упражнения</h1>
        <p>Выбери упражнение для тренировки</p>
      </div>

      <div className="exercise-list">
        {exercises.map((exercise) => (
          <div
            key={exercise.id}
            className={`exercise-item ${exercise.is_custom ? 'custom-exercise' : ''}`}
            onClick={() => startWorkout(exercise)}
          >
            <div className="exercise-name">
              {exercise.is_custom ? '👤 ' : '💪 '}
              {exercise.name}
            </div>
            <div className="exercise-category">{exercise.category}</div>
          </div>
        ))}
      </div>

      <button className="btn btn-secondary" onClick={() => onNavigate('main')}>
        ← Назад
      </button>
    </div>
  );
};

export default ExercisesScreen;
