import React, { useState, useEffect } from 'react';
import './App.css';
import MainScreen from './components/MainScreen';
import ExercisesScreen from './components/ExercisesScreen';
import WorkoutScreen from './components/WorkoutScreen';
import HistoryScreen from './components/HistoryScreen';
import StatsScreen from './components/StatsScreen';
import AddExerciseScreen from './components/AddExerciseScreen';
import { apiService } from './services/api';

// Global state for navigation
let navigationState = {};

function App() {
  const [currentScreen, setCurrentScreen] = useState('main');
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ totalWorkouts: 0, totalExercises: 0 });

  useEffect(() => {
    // Initialize Telegram Web App
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.expand();
      tg.ready();

      // Get user info from Telegram
      const telegramUser = tg.initDataUnsafe?.user;
      if (telegramUser) {
        initializeUser(telegramUser);
      } else {
        // For local development
        initializeUser({
          id: 12345,
          first_name: 'Тестовый',
          username: 'test_user'
        });
      }
    }
  }, []);

  const initializeUser = async (telegramUser) => {
    try {
      const userData = await apiService.createUser(
        telegramUser.id,
        telegramUser.username || '',
        telegramUser.first_name || ''
      );
      setUser(userData);
      loadStats(userData.id);
    } catch (error) {
      console.error('Error initializing user:', error);
    }
  };

  const loadStats = async (userId) => {
    try {
      const [workoutLogs, exercises] = await Promise.all([
        apiService.getWorkoutLogs(userId, 100),
        apiService.getExercises()
      ]);
      
      setStats({
        totalWorkouts: workoutLogs.length,
        totalExercises: exercises.length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const navigate = (screen, state = {}) => {
    navigationState = state;
    setCurrentScreen(screen);
  };

  const renderScreen = () => {
    if (!user) {
      return (
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Загрузка...</p>
        </div>
      );
    }

    switch (currentScreen) {
      case 'main':
        return (
          <MainScreen
            user={user}
            stats={stats}
            onNavigate={navigate}
            onStatsUpdate={() => loadStats(user.id)}
          />
        );
      case 'exercises':
        return (
          <ExercisesScreen
            user={user}
            onNavigate={navigate}
            onWorkoutComplete={() => loadStats(user.id)}
          />
        );
      case 'workout':
        return (
          <WorkoutScreen
            user={user}
            exercise={navigationState.exercise}
            onNavigate={navigate}
            onWorkoutComplete={() => loadStats(user.id)}
          />
        );
      case 'history':
        return <HistoryScreen user={user} onNavigate={navigate} />;
      case 'stats':
        return <StatsScreen user={user} onNavigate={navigate} />;
      case 'add-exercise':
        return (
          <AddExerciseScreen
            user={user}
            onNavigate={navigate}
            onExerciseAdded={() => loadStats(user.id)}
          />
        );
      default:
        return (
          <MainScreen
            user={user}
            stats={stats}
            onNavigate={navigate}
            onStatsUpdate={() => loadStats(user.id)}
          />
        );
    }
  };

  return (
    <div className="App">
      <div className="container">
        {renderScreen()}
      </div>
    </div>
  );
}

export default App;
