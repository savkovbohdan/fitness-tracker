import React, { useState } from 'react';
import { apiService } from '../services/api';

const AddExerciseScreen = ({ user, onNavigate, onExerciseAdded }) => {
  const [name, setName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [photo, setPhoto] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = [
    { id: 'ноги', name: '🦵 Ноги' },
    { id: 'грудь', name: '💪 Грудь' },
    { id: 'спина', name: '🔙 Спина' },
    { id: 'руки', name: '💪 Руки' },
    { id: 'плечи', name: '🤸 Плечи' },
    { id: 'пресс', name: '🎯 Пресс' }
  ];

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

  const selectCategory = (categoryId) => {
    setSelectedCategory(categoryId);
    hapticFeedback();
  };

  const addExercise = async () => {
    if (!name.trim()) {
      showMessage('Пожалуйста, введи название упражнения', 'error');
      return;
    }

    if (!selectedCategory) {
      showMessage('Пожалуйста, выбери категорию', 'error');
      return;
    }

    setLoading(true);

    try {
      await apiService.createExercise(
        name.trim(),
        selectedCategory,
        photo.trim() || null
      );

      hapticFeedback();
      showMessage('Упражнение добавлено!', 'success');

      // Reset form
      setName('');
      setSelectedCategory('');
      setPhoto('');

      setTimeout(() => {
        onExerciseAdded();
        onNavigate('main');
      }, 1500);

    } catch (error) {
      console.error('Error adding exercise:', error);
      showMessage('Ошибка добавления упражнения', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="slide-up">
      <div className="header">
        <h1>➕ Добавить упражнение</h1>
        <p>Создай свое упражнение</p>
      </div>

      {message && (
        <div className={`${messageType}-message`}>
          {message}
        </div>
      )}

      <div className="form-container">
        <div className="form-group">
          <label className="form-label">Название упражнения</label>
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Болгарские сплит-приседания"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Категория</label>
          <div className="category-buttons">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-btn ${selectedCategory === category.id ? 'selected' : ''}`}
                onClick={() => selectCategory(category.id)}
                disabled={loading}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Фото (URL)</label>
          <input
            type="url"
            className="form-input"
            value={photo}
            onChange={(e) => setPhoto(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            disabled={loading}
          />
        </div>

        <button 
          className="btn" 
          onClick={addExercise}
          disabled={loading}
        >
          {loading ? 'Добавление...' : '✅ Добавить упражнение'}
        </button>
      </div>

      <button 
        className="btn btn-secondary" 
        onClick={() => onNavigate('main')} 
        style={{ marginTop: '20px' }}
        disabled={loading}
      >
        ← Назад
      </button>
    </div>
  );
};

export default AddExerciseScreen;
