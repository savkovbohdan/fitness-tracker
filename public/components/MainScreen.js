const MainScreen = ({ setScreen, error, success }) => {
    return (
        <div className="container">
            <div className="header">
                <h1>🏋️‍♂️ Фитнес-Трекер</h1>
                <p>Отслеживай свои тренировки</p>
            </div>
            
            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}
            
            <div className="card">
                <button className="button" onClick={() => setScreen('exercises')}>
                    💪 Начать тренировку
                </button>
                <button className="button" onClick={() => setScreen('history')}>
                    📊 История тренировок
                </button>
                <button className="button" onClick={() => setScreen('stats')}>
                    📈 Моя статистика
                </button>
            </div>
        </div>
    );
};

export default MainScreen;
