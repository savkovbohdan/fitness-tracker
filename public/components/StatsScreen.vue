<template>
    <div class="container">
        <div class="header">
            <h1>📈 Статистика</h1>
            <p>Твои достижения</p>
        </div>
        
        <div class="nav-tabs">
            <button class="nav-tab" @click="$emit('change-screen', 'exercises')">
                💪 Упражнения
            </button>
            <button class="nav-tab" @click="$emit('change-screen', 'history')">
                📊 История
            </button>
            <button class="nav-tab active" @click="$emit('change-screen', 'stats')">
                📈 Статистика
            </button>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">12</div>
                <div class="stat-label">Всего тренировок</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">248</div>
                <div class="stat-label">Всего подходов</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">1,856</div>
                <div class="stat-label">Всего повторений</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">8</div>
                <div class="stat-label">Активных дней</div>
            </div>
        </div>
        
        <div class="card">
            <h3 style="margin-bottom: 20px; color: #1a202c; font-size: 20px; font-weight: 700;">
                🏋️‍♂️ Общая статистика
            </h3>
            <div style="padding: 16px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <span>Всего тренировок:</span>
                    <strong>12</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <span>Всего подходов:</span>
                    <strong>248</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <span>Всего повторений:</span>
                    <strong>1,856</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Активных дней:</span>
                    <strong>8</strong>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h3 style="margin-bottom: 20px; color: #1a202c; font-size: 20px; font-weight: 700;">
                💪 Лучшие упражнения
            </h3>
            <div style="padding: 16px 0;">
                <div style="display: flex; align-items: center; margin-bottom: 16px;">
                    <ExerciseIcon :size="32" />
                    <div style="flex: 1; margin-left: 16px;">
                        <div style="font-weight: bold;">Жим лежа</div>
                        <div style="font-size: 12px; color: #6b7280;">Макс. вес: 80 кг</div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 16px;">
                    <ExerciseIcon :size="32" />
                    <div style="flex: 1; margin-left: 16px;">
                        <div style="font-weight: bold;">Приседания</div>
                        <div style="font-size: 12px; color: #6b7280;">Макс. вес: 100 кг</div>
                    </div>
                </div>
                <div style="display: flex; align-items: center;">
                    <ExerciseIcon :size="32" />
                    <div style="flex: 1; margin-left: 16px;">
                        <div style="font-weight: bold;">Становая тяга</div>
                        <div style="font-size: 12px; color: #6b7280;">Макс. вес: 120 кг</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h3 style="margin-bottom: 20px; color: #1a202c; font-size: 20px; font-weight: 700;">
                📅 Прогресс за неделю
            </h3>
            <div style="padding: 16px 0;">
                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="font-size: 24px; font-weight: bold; color: #10b981;">
                        +15%
                    </div>
                    <div style="font-size: 12px; color: #6b7280;">
                        Рост общего веса
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #6b7280;">
                    <span>Пн</span>
                    <span>Вт</span>
                    <span>Ср</span>
                    <span>Чт</span>
                    <span>Пт</span>
                    <span>Сб</span>
                    <span>Вс</span>
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
    name: 'StatsScreen',
    components: { ExerciseIcon },
    emits: ['change-screen']
}
</script>
