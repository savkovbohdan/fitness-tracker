const HistoryScreen = ({ workoutHistory, loading, loadWorkoutHistory }) => {
    return (
        <div className="container">
            <div className="header">
                <h1>📊 История</h1>
                <p>Твои прошлые тренировки</p>
            </div>
            
            {loading ? (
                <div className="loading">Загрузка истории...</div>
            ) : workoutHistory.length === 0 ? (
                <div className="card">
                    <div className="loading">История тренировок пуста</div>
                </div>
            ) : (
                workoutHistory.map(day => (
                    <div key={day.date} className="card" style={{marginBottom: '20px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                            <h3 style={{margin: 0, color: '#10b981'}}>
                                {new Date(day.date).toLocaleDateString('ru-RU', { 
                                    day: 'numeric', 
                                    month: 'long', 
                                    year: 'numeric' 
                                })}
                            </h3>
                            <div style={{fontSize: '14px', color: '#6b7280'}}>
                                {day.totalSets} подходов, {day.totalReps} повторений
                            </div>
                        </div>
                        
                        {day.exercises.map(exercise => (
                            <div key={exercise.name} style={{padding: '12px', marginBottom: '8px', backgroundColor: '#f9fafb', borderRadius: '8px'}}>
                                <div style={{display: 'flex', alignItems: 'center', marginBottom: '8px'}}>
                                    {/* Фото слева */}
                                    <ExerciseIcon photoUrl={exercise.photo_url} size={40} />
                                    
                                    {/* Информация об упражнении */}
                                    <div style={{flex: 1, minWidth: 0}}>
                                        <div style={{fontWeight: 'bold', fontSize: '16px', marginBottom: '2px'}}>
                                            {exercise.name}
                                        </div>
                                        <div style={{fontSize: '12px', color: '#6b7280'}}>
                                            <span className="category">{exercise.category}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Статистика справа */}
                                    <div style={{textAlign: 'right', marginLeft: '12px', flexShrink: 0}}>
                                        <div style={{fontSize: '14px', fontWeight: 'bold', color: '#10b981'}}>
                                            {exercise.maxWeight}
                                        </div>
                                        <div style={{fontSize: '12px', color: '#6b7280'}}>
                                            {exercise.totalSets}×{exercise.totalReps}
                                        </div>
                                    </div>
                                </div>
                                
                                <div style={{fontSize: '12px', color: '#9ca3af', marginBottom: '4px', paddingLeft: '52px'}}>
                                    Подходы: {exercise.setsDetail}
                                </div>
                                
                                <div style={{fontSize: '11px', color: '#9ca3af', paddingLeft: '52px'}}>
                                    Последний подход: {new Date(exercise.lastSetTime).toLocaleTimeString('ru-RU', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ))
            )}
            
            <button className="button" onClick={() => setScreen('main')}>
                ← Назад
            </button>
        </div>
    );
};

export default HistoryScreen;
