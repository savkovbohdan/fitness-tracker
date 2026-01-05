<template>
    <div class="container">
        <div class="header">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <ExerciseIcon :photoUrl="selectedExercise.photo_url" :size="60" 
                             style="border: 2px solid #e5e7eb;" />
                <div>
                    <h1 style="margin: 0;">💪 Тренировка</h1>
                    <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: bold;">
                        {{ selectedExercise.name }}
                    </p>
                    <span class="category">{{ selectedExercise.category }}</span>
                </div>
            </div>
        </div>
        
        <div v-if="savedSets.length > 0" class="card">
            <h3>Сохраненные подходы ({{ savedSets.length }}):</h3>
            <div v-for="set in savedSets" :key="set.id" 
                 style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <strong>Подход {{ set.set_number }}:</strong> 
                {{ set.reps }} повторений, {{ set.weight }} 
                {{ set.weight === 'Собственный вес' ? '' : 'кг' }}
            </div>
        </div>
        
        <div class="card">
            <h3>Добавить подход:</h3>
            <div style="margin: 16px 0;">
                <div style="margin: 12px 0;">
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" v-model="useBodyweight" style="margin-right: 8px;" />
                        Собственный вес
                    </label>
                </div>
                
                <input v-if="!useBodyweight" type="number" placeholder="Вес (кг)" 
                       v-model="weight" style="margin-bottom: 12px;" />
                <input type="number" placeholder="Количество повторений" v-model="reps" />
            </div>
            
            <div style="display: flex; gap: 8px;">
                <button class="button" @click="addSet" style="flex: 1;">
                    ➕ Добавить подход
                </button>
                <button class="button danger" @click="finishWorkout" style="flex: 1;">
                    ✅ Завершить тренировку
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import ExerciseIcon from './ExerciseIcon.vue'

export default {
    name: 'WorkoutScreen',
    components: { ExerciseIcon },
    emits: ['change-screen', 'show-success', 'show-error'],
    props: {
        selectedExercise: Object
    },
    data() {
        return {
            savedSets: [],
            weight: '',
            reps: '',
            useBodyweight: false
        };
    },
    methods: {
        async addSet() {
            if (!this.reps.trim()) {
                this.$emit('show-error', 'Введите количество повторений');
                return;
            }

            if (!this.useBodyweight && !this.weight.trim()) {
                this.$emit('show-error', 'Введите вес или выберите "Собственный вес"');
                return;
            }

            try {
                const response = await axios.post('/api/workout-sets', {
                    exercise_id: this.selectedExercise.id,
                    reps: parseInt(this.reps),
                    weight: this.useBodyweight ? 'Собственный вес' : parseFloat(this.weight)
                });

                this.savedSets.push(response.data);
                this.$emit('show-success', 'Подход добавлен!');
                this.reps = '';
                this.weight = '';
                
                setTimeout(() => this.$emit('show-success', ''), 2000);
            } catch (err) {
                this.$emit('show-error', err.response?.data?.error || 'Ошибка при сохранении подхода');
            }
        },
        finishWorkout() {
            this.$emit('show-success', 'Тренировка завершена! Сохранено подходов: ' + this.savedSets.length);
            setTimeout(() => {
                this.$emit('change-screen', 'main');
            }, 2000);
        }
    }
}
</script>
