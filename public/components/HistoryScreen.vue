<template>
    <div class="container">
        <div class="header">
            <h1>📊 История</h1>
            <p>Твои прошлые тренировки</p>
        </div>
        
        <div class="nav-tabs">
            <button class="nav-tab" @click="$emit('change-screen', 'exercises')">
                💪 Упражнения
            </button>
            <button class="nav-tab active" @click="$emit('change-screen', 'history')">
                📊 История
            </button>
            <button class="nav-tab" @click="$emit('change-screen', 'stats')">
                📈 Статистика
            </button>
        </div>
        
        <div v-if="loading" class="loading">🔄 Загрузка истории...</div>
        <div v-else-if="workoutHistory.length === 0" class="card">
            <div class="loading">История тренировок пуста</div>
        </div>
        <div v-else>
            <div v-for="day in workoutHistory" :key="day.date" class="workout-day">
                <div class="workout-day-header">
                    <h3 class="workout-day-title">
                        {{ new Date(day.date).toLocaleDateString('ru-RU', { 
                            day: 'numeric', month: 'long', year: 'numeric' 
                        }) }}
                    </h3>
                    <div class="workout-day-stats">
                        {{ day.totalSets }} подходов, {{ day.totalReps }} повторений
                    </div>
                </div>
                <div v-for="exercise in day.exercises" :key="exercise.name" class="exercise-in-history">
                    <div style="display: flex; align-items: center; margin-bottom: 12px;">
                        <ExerciseIcon :photoUrl="exercise.photo_url" :size="40" />
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">
                                {{ exercise.name }}
                            </div>
                            <div style="font-size: 12px; color: #718096;">
                                <span class="category">{{ exercise.category }}</span>
                            </div>
                        </div>
                        <div style="text-align: right; margin-left: 12px; flex-shrink: 0;">
                            <div style="font-size: 14px; font-weight: bold; color: #667eea;">
                                {{ exercise.maxWeight }}
                            </div>
                            <div style="font-size: 12px; color: #718096;">
                                {{ exercise.totalSets }}×{{ exercise.totalReps }}
                            </div>
                        </div>
                    </div>
                    <div style="font-size: 12px; color: #718096; margin-bottom: 4px; padding-left: 56px;">
                        Подходы: {{ exercise.setsDetail }}
                    </div>
                    <div style="font-size: 11px; color: #a0aec0; padding-left: 56px;">
                        Последний подход: {{ new Date(exercise.lastSetTime).toLocaleTimeString('ru-RU', {
                            hour: '2-digit', minute: '2-digit'
                        }) }}
                    </div>
                </div>
            </div>
        </div>
        
        <button class="button secondary" @click="$emit('change-screen', 'main')" style="margin-top: 20px;">
            ← Назад
        </button>
    </div>
</template>

<script>
import ExerciseIcon from './ExerciseIcon.vue'

export default {
    name: 'HistoryScreen',
    components: { ExerciseIcon },
    emits: ['change-screen'],
    data() {
        return {
            workoutHistory: [],
            loading: false
        };
    },
    methods: {
        async loadWorkoutHistory() {
            this.loading = true;
            try {
                const response = await axios.get('/api/workout-logs/1');
                this.workoutHistory = response.data;
            } catch (err) {
                console.error('Error loading workout history:', err);
                this.workoutHistory = [];
            } finally {
                this.loading = false;
            }
        }
    },
    mounted() {
        this.loadWorkoutHistory();
    }
}
</script>
