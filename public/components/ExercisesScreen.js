const ExercisesScreen = ({ 
    exercises, 
    loading, 
    showAddForm, 
    newExercise, 
    addingExercise, 
    uploadingPhoto, 
    fileInputRef, 
    setShowAddForm, 
    setNewExercise, 
    selectExercise, 
    addExercise, 
    uploadPhoto 
}) => {
    return (
        <div className="container">
            <div className="header">
                <h1>💪 Упражнения</h1>
                <p>Выбери упражнение для тренировки</p>
            </div>
            
            <button 
                className="button" 
                onClick={() => setShowAddForm(true)}
                style={{marginBottom: '20px'}}
            >
                ➕ Добавить упражнение
            </button>
            
            {showAddForm && (
                <div className="card">
                    <h3>Новое упражнение</h3>
                    <div style={{marginBottom: '16px'}}>
                        <input
                            type="text"
                            placeholder="Название упражнения"
                            value={newExercise.name}
                            onChange={(e) => setNewExercise({...newExercise, name: e.target.value})}
                        />
                        <select
                            value={newExercise.category}
                            onChange={(e) => setNewExercise({...newExercise, category: e.target.value})}
                        >
                            <option value="грудь">Грудь</option>
                            <option value="ноги">Ноги</option>
                            <option value="спина">Спина</option>
                            <option value="плечи">Плечи</option>
                            <option value="руки">Руки</option>
                            <option value="пресс">Пресс</option>
                        </select>
                        
                        <div style={{marginBottom: '12px'}}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const file = e.target.files[0];
                                    if (file) {
                                        uploadPhoto(file);
                                    }
                                    e.target.value = '';
                                }}
                                style={{display: 'none'}}
                            />
                            <button
                                className="button"
                                style={{background: '#6b7280', width: '100%'}}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingPhoto}
                            >
                                {uploadingPhoto ? 'Загрузка...' : '📷 Добавить фото'}
                            </button>
                        </div>
                        
                        {newExercise.photo_url && (
                            <div style={{marginBottom: '12px', textAlign: 'center'}}>
                                <img 
                                    src={newExercise.photo_url} 
                                    alt="Preview"
                                    style={{
                                        width: '100px',
                                        height: '100px',
                                        objectFit: 'cover',
                                        borderRadius: '8px',
                                        border: '2px solid #10b981'
                                    }}
                                />
                                <div style={{fontSize: '12px', color: '#6b7280', marginTop: '4px'}}>
                                    Фото загружено
                                </div>
                            </div>
                        )}
                    </div>
                    <div style={{display: 'flex', gap: '8px'}}>
                        <button 
                            className="button"
                            style={{background: '#10b981'}}
                            onClick={addExercise}
                            disabled={addingExercise || uploadingPhoto}
                        >
                            {addingExercise ? 'Добавление...' : 'Добавить'}
                        </button>
                        <button 
                            className="button"
                            style={{background: '#6b7280'}}
                            onClick={() => {
                                setShowAddForm(false);
                                setNewExercise({ name: '', category: 'грудь', photo_url: '' });
                            }}
                        >
                            Отмена
                        </button>
                    </div>
                </div>
            )}
            
            {loading ? (
                <div className="loading">Загрузка упражнений...</div>
            ) : (
                <div className="card">
                    {exercises.map(exercise => (
                        <div key={exercise.id} className="exercise-item">
                            <div className="exercise-content">
                                <div className="exercise-photo">
                                    {exercise.photo_url ? (
                                        <img 
                                            src={exercise.photo_url} 
                                            alt={exercise.name}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: '#f3f4f6',
                                            borderRadius: '8px',
                                            fontSize: '32px',
                                            color: '#9ca3af'
                                        }}>
                                            💪
                                        </div>
                                    )}
                                </div>
                                <div className="exercise-info">
                                    <div className="exercise-name">{exercise.name}</div>
                                    <span className="category">{exercise.category}</span>
                                </div>
                            </div>
                            <button 
                                className="button" 
                                style={{width: 'auto', padding: '8px 16px', fontSize: '14px'}}
                                onClick={() => selectExercise(exercise)}
                            >
                                Выбрать
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            <button className="button" onClick={() => setScreen('main')}>
                ← Назад
            </button>
        </div>
    );
};

export default ExercisesScreen;
