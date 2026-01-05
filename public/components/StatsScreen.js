const StatsScreen = () => {
    return (
        <div className="container">
            <div className="header">
                <h1>📈 Статистика</h1>
                <p>Твои достижения</p>
            </div>
            
            <div className="card">
                <h3>🏋️‍♂️ Общая статистика</h3>
                <div style={{padding: '16px 0'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px'}}>
                        <span>Всего тренировок:</span>
                        <strong>12</strong>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px'}}>
                        <span>Всего подходов:</span>
                        <strong>248</strong>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px'}}>
                        <span>Всего повторений:</span>
                        <strong>1,856</strong>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <span>Активных дней:</span>
                        <strong>8</strong>
                    </div>
                </div>
            </div>
            
            <div className="card">
                <h3>💪 Лучшие упражнения</h3>
                <div style={{padding: '16px 0'}}>
                    <div style={{display: 'flex', alignItems: 'center', marginBottom: '12px'}}>
                        <ExerciseIcon size={32} />
                        <div style={{flex: 1, marginLeft: '12px'}}>
                            <div style={{fontWeight: 'bold'}}>Жим лежащи</div>
                            <div style={{fontSize: '12px', color: '#6b7280'}}>Макс. вес: 80 кг</div>
                        </div>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', marginBottom: '12px'}}>
                        <ExerciseIcon size={32} />
                        <div style={{flex: 1, marginLeft: '12px'}}>
                            <div style={{fontWeight: 'bold'}}>Приседания</div>
                            <div style={{fontSize: '12px', color: '#6b7280'}}>Макс. вес: 100 кг</div>
                        </div>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <ExerciseIcon size={32} />
                        <div style={{flex: 1, marginLeft: '12px'}}>
                            <div style={{fontWeight: 'bold'}}>Становая тяга</div>
                            <div style={{fontSize: '12px', color: '#6b7280'}}>Макс. вес: 120 кг</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="card">
                <h3>📅 Прогресс за неделю</h3>
                <div style={{padding: '16px 0'}}>
                    <div style={{textAlign: 'center', marginBottom: '16px'}}>
                        <div style={{fontSize: '24px', fontWeight: 'bold', color: '#10b981'}}>
                            +15%
                        </div>
                        <div style={{fontSize: '12px', color: '#6b7280'}}>
                            Рост общего веса
                        </div>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280'}}>
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
            
            <button className="button" onClick={() => setScreen('main')}>
                ← Назад
            </button>
        </div>
    );
};

export default StatsScreen;
