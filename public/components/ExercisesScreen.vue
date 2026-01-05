<template>
    <div class="container">
        <div class="header">
            <h1>💪 Упражнения</h1>
            <p>Выбери упражнение для тренировки</p>
        </div>
        
        <div class="nav-tabs">
            <button class="nav-tab active" @click="$emit('change-screen', 'exercises')">
                💪 Упражнения
            </button>
            <button class="nav-tab" @click="$emit('change-screen', 'history')">
                📊 История
            </button>
            <button class="nav-tab" @click="$emit('change-screen', 'stats')">
                📈 Статистика
            </button>
        </div>
        
        <button class="button glow" @click="showAddForm = true" style="margin-bottom: 24px;">
            ➕ Добавить новое упражнение
        </button>
        
        <div v-if="showAddForm" class="form-section">
            <h3 style="margin-bottom: 20px; color: white; font-size: 20px; font-weight: 700;">
                Новое упражнение
            </h3>
            <div class="form-group">
                <label class="form-label">Название упражнения</label>
                <input v-model="newExercise.name" placeholder="Например: Жим лежа" />
            </div>
            <div class="form-group">
                <label class="form-label">Категория</label>
                <select v-model="newExercise.category">
                    <option value="грудь">💪 Грудь</option>
                    <option value="ноги">🦵 Ноги</option>
                    <option value="спина">🔙 Спина</option>
                    <option value="плечи">🤸 Плечи</option>
                    <option value="руки">💪 Руки</option>
                    <option value="пресс">🎯 Пресс</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Фото упражнения</label>
                <input type="file" @change="uploadPhoto($event.target.files[0])" 
                       accept="image/*" style="display: none;" ref="fileInput" />
                <button class="button secondary" @click="$refs.fileInput.click()" 
                        :disabled="uploadingPhoto" style="width: 100%;">
                    {{ uploadingPhoto ? '📸 Загрузка...' : '📷 Выбрать фото' }}
                </button>
            </div>
            
            <div v-if="newExercise.photo_url" style="margin-bottom: 20px; text-align: center;">
                <img :src="newExercise.photo_url" alt="Preview"
                     style="width: 120px; height: 120px; object-fit: cover; 
                            border-radius: 16px; border: 3px solid #4299e1; box-shadow: 0 8px 20px rgba(0,0,0,0.2);" />
                <div style="font-size: 14px; color: white; margin-top: 8px; font-weight: 600;">
                    ✅ Фото загружено
                </div>
            </div>
            
            <div style="display: flex; gap: 12px;">
                <button class="button" @click="addExercise" 
                        :disabled="addingExercise || uploadingPhoto">
                    {{ addingExercise ? '⏳ Добавление...' : '✅ Добавить упражнение' }}
                </button>
                <button class="button secondary" @click="showAddForm = false">
                    ❌ Отмена
                </button>
            </div>
        </div>
        
        <div v-if="loading" class="loading">🔄 Загрузка упражнений...</div>
        <div v-else class="card">
            <h3 style="margin-bottom: 24px; color: #1a202c; font-size: 20px; font-weight: 700;">
                Доступные упражнения ({{ exercises.length }})
            </h3>
            <div v-for="exercise in exercises" :key="exercise.id" class="exercise-item">
                <div class="exercise-content">
                    <div class="exercise-photo">
                        <img v-if="exercise.photo_url" :src="exercise.photo_url" :alt="exercise.name"
                             @error="$event.target.style.display = 'none'" />
                        <div v-else style="width: 100%; height: 100%; display: flex; 
                                   align-items: center; justify-content: center; 
                                   background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); 
                                   border-radius: 16px; font-size: 36px; color: white;">
                            💪
                        </div>
                    </div>
                    <div class="exercise-info">
                        <div class="exercise-name">{{ exercise.name }}</div>
                        <span class="category">{{ exercise.category }}</span>
                    </div>
                </div>
                <button class="button secondary" @click="selectExercise(exercise)">
                    Выбрать →
                </button>
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
    name: 'ExercisesScreen',
    components: { ExerciseIcon },
    emits: ['change-screen', 'select-exercise', 'show-error', 'show-success', 'refresh-exercises'],
    props: {
        exercises: Array,
        loading: Boolean
    },
    data() {
        return {
            showAddForm: false,
            newExercise: { name: '', category: 'грудь', photo_url: '' },
            addingExercise: false,
            uploadingPhoto: false
        };
    },
    methods: {
        async uploadPhoto(file) {
            if (!file) return;
            
            this.uploadingPhoto = true;
            const formData = new FormData();
            formData.append('photo', file);

            try {
                const response = await axios.post('/api/upload-exercise-photo', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                this.newExercise.photo_url = response.data.photo_url;
                this.$emit('show-success', 'Фото загружено!');
            } catch (err) {
                this.$emit('show-error', 'Ошибка при загрузке фото: ' + (err.response?.data?.error || err.message));
            } finally {
                this.uploadingPhoto = false;
            }
        },
        async addExercise() {
            if (!this.newExercise.name.trim()) {
                this.$emit('show-error', 'Название упражнения обязательно');
                return;
            }

            this.addingExercise = true;
            try {
                await axios.post('/api/exercises', this.newExercise);
                this.$emit('show-success', 'Упражнение "' + this.newExercise.name + '" добавлено!');
                this.$emit('refresh-exercises');
                
                setTimeout(() => {
                    this.showAddForm = false;
                    this.newExercise = { name: '', category: 'грудь', photo_url: '' };
                }, 2000);
            } catch (err) {
                this.$emit('show-error', err.response?.data?.error || 'Ошибка при добавлении упражнения');
            } finally {
                this.addingExercise = false;
            }
        },
        selectExercise(exercise) {
            this.$emit('select-exercise', exercise);
        }
    }
}
</script>
