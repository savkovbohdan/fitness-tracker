<template>
    <div class="container">
        <div class="header">
            <h1>💪 Фитнес-Трекер</h1>
            <p>Отслеживай свои тренировки</p>
        </div>
        
        <div v-if="error" class="error">{{ error }}</div>
        <div v-if="success" class="success">{{ success }}</div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">12</div>
                <div class="stat-label">Тренировок</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">248</div>
                <div class="stat-label">Подходов</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">1.8K</div>
                <div class="stat-label">Повторений</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">8</div>
                <div class="stat-label">Дней</div>
            </div>
        </div>
        
        <div class="nav-tabs">
            <button class="nav-tab active" @click="$emit('change-screen', 'exercises')">
                💪 Тренировки
            </button>
            <button class="nav-tab" @click="$emit('change-screen', 'history')">
                📊 История
            </button>
            <button class="nav-tab" @click="$emit('change-screen', 'stats')">
                📈 Статистика
            </button>
        </div>
        
        <div class="card">
            <h3 style="margin-bottom: 20px; color: #1a202c; font-size: 20px; font-weight: 700;">
                Быстрые действия
            </h3>
            <button class="button pulse" @click="$emit('change-screen', 'exercises')">
                🚀 Начать тренировку
            </button>
            <button class="button secondary" @click="$emit('change-screen', 'exercises')">
                ➕ Добавить упражнение
            </button>
        </div>
    </div>
</template>

<script>
export default {
    name: 'MainScreen',
    emits: ['change-screen'],
    props: {
        error: String,
        success: String
    }
}
</script>
