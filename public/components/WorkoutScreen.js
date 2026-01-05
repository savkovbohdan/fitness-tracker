const WorkoutScreen = ({ 
    selectedExercise, 
    savedSets, 
    error, 
    success, 
    weight, 
    reps, 
    useBodyweight, 
    setWeight, 
    setReps, 
    setUseBodyweight, 
    addSet, 
    finishWorkout 
}) => {
    return (
        <div className="container">
            <div className="header">
                <div style={{display: 'flex', alignItems: 'center', marginBottom: '12px'}}>
                    <ExerciseIcon 
                        photoUrl={selectedExercise.photo_url} 
                        size={60}
                        style={{border: '2px solid #e5e7eb'}}
                    />
                    <div>
                        <h1 style={{margin: 0}}>💪 Тренировка</h1>
                        <p style={{margin: '4px 0 0 0', fontSize: '18px', fontWeight: 'bold'}}>
                            {selectedExercise.name}
                        </p>
                        <span className="category">{selectedExercise.category}</span>
                    </div>
                </div>
            </div>
            
            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}
            
            {savedSets.length > 0 && (
                <div className="card">
                    <h3>Сохраненные подходы ({savedSets.length}):</h3>
                    {savedSets.map(set => (
                        <div key={set.id} style={{padding: '8px 0', borderBottom: '1px solid #e5e7eb'}}>
                            <strong>Подход {set.set_number}:</strong> {set.reps} повторений, {set.weight} {set.weight === 'Собственный вес' ? '' : 'кг'}
                        </div>
                    ))}
                </div>
            )}
            
            <div className="card">
                <h3>Добавить подход:</h3>
                <div style={{margin: '16px 0'}}>
                    <div style={{margin: '12px 0'}}>
                        <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                            <input 
                                type="checkbox" 
                                checked={useBodyweight}
                                onChange={(e) => setUseBodyweight(e.target.checked)}
                                style={{marginRight: '8px'}}
                            />
                            Собственный вес
                        </label>
                    </div>
                    
                    {!useBodyweight && (
                        <input 
                            type="number" 
                            placeholder="Вес (кг)"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            style={{marginBottom: '12px'}}
                        />
                    )}
                    
                    <input 
                        type="number" 
                        placeholder="Количество повторений"
                        value={reps}
                        onChange={(e) => setReps(e.target.value)}
                    />
                </div>
                
                <div style={{display: 'flex', gap: '8px'}}>
                    <button 
                        className="button" 
                        onClick={addSet}
                        style={{flex: 1}}
                    >
                        ➕ Добавить подход
                    </button>
                    <button 
                        className="button" 
                        onClick={finishWorkout} 
                        style={{flex: 1, background: '#ef4444'}}
                    >
                        ✅ Завершить тренировку
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkoutScreen;
