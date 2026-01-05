// ExerciseIcon Component
const ExerciseIcon = ({ photoUrl, size = 40, style = {} }) => {
    const iconStyle = {
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '6px',
        marginRight: '12px',
        border: '1px solid #e5e7eb',
        flexShrink: 0,
        ...style
    };

    if (photoUrl) {
        return React.createElement('img', {
            src: photoUrl,
            alt: "Exercise",
            style: {
                ...iconStyle,
                objectFit: 'cover'
            }
        });
    }

    return React.createElement('div', {
        style: {
            ...iconStyle,
            backgroundColor: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${size * 0.45}px`,
            color: '#9ca3af'
        }
    }, '💪');
};

// MainScreen Component
const MainScreen = ({ setScreen, error, success }) => {
    return React.createElement('div', { className: "container" },
        React.createElement('div', { className: "header" },
            React.createElement('h1', null, "🏋️‍♂️ Фитнес-Трекер"),
            React.createElement('p', null, "Отслеживай свои тренировки")
        ),
        error && React.createElement('div', { className: "error" }, error),
        success && React.createElement('div', { className: "success" }, success),
        React.createElement('div', { className: "card" },
            React.createElement('button', { className: "button", onClick: () => setScreen('exercises') }, "💪 Начать тренировку"),
            React.createElement('button', { className: "button", onClick: () => setScreen('history') }, "📊 История тренировок"),
            React.createElement('button', { className: "button", onClick: () => setScreen('stats') }, "📈 Моя статистика")
        )
    );
};

// ExercisesScreen Component
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
    return React.createElement('div', { className: "container" },
        React.createElement('div', { className: "header" },
            React.createElement('h1', null, "💪 Упражнения"),
            React.createElement('p', null, "Выбери упражнение для тренировки")
        ),
        React.createElement('button', { 
            className: "button", 
            onClick: () => setShowAddForm(true),
            style: {marginBottom: '20px'}
        }, "➕ Добавить упражнение"),
        
        showAddForm && React.createElement('div', { className: "card" },
            React.createElement('h3', null, "Новое упражнение"),
            React.createElement('div', { style: {marginBottom: '16px'} },
                React.createElement('input', {
                    type: "text",
                    placeholder: "Название упражнения",
                    value: newExercise.name,
                    onChange: (e) => setNewExercise({...newExercise, name: e.target.value})
                }),
                React.createElement('select', {
                    value: newExercise.category,
                    onChange: (e) => setNewExercise({...newExercise, category: e.target.value})
                },
                    React.createElement('option', {value: "грудь"}, "Грудь"),
                    React.createElement('option', {value: "ноги"}, "Ноги"),
                    React.createElement('option', {value: "спина"}, "Спина"),
                    React.createElement('option', {value: "плечи"}, "Плечи"),
                    React.createElement('option', {value: "руки"}, "Руки"),
                    React.createElement('option', {value: "пресс"}, "Пресс")
                ),
                React.createElement('div', { style: {marginBottom: '12px'} },
                    React.createElement('input', {
                        type: "file",
                        ref: fileInputRef,
                        accept: "image/*",
                        onChange: (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const file = e.target.files[0];
                            if (file) {
                                uploadPhoto(file);
                            }
                            e.target.value = '';
                        },
                        style: {display: 'none'}
                    }),
                    React.createElement('button', {
                        className: "button",
                        style: {background: '#6b7280', width: '100%'},
                        onClick: () => fileInputRef.current?.click(),
                        disabled: uploadingPhoto
                    }, uploadingPhoto ? 'Загрузка...' : '📷 Добавить фото')
                ),
                newExercise.photo_url && React.createElement('div', { style: {marginBottom: '12px', textAlign: 'center'} },
                    React.createElement('img', {
                        src: newExercise.photo_url,
                        alt: "Preview",
                        style: {
                            width: '100px',
                            height: '100px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '2px solid #10b981'
                        }
                    }),
                    React.createElement('div', { style: {fontSize: '12px', color: '#6b7280', marginTop: '4px'} }, "Фото загружено")
                )
            ),
            React.createElement('div', { style: {display: 'flex', gap: '8px'} },
                React.createElement('button', {
                    className: "button",
                    style: {background: '#10b981'},
                    onClick: addExercise,
                    disabled: addingExercise || uploadingPhoto
                }, addingExercise ? 'Добавление...' : 'Добавить'),
                React.createElement('button', {
                    className: "button",
                    style: {background: '#6b7280'},
                    onClick: () => {
                        setShowAddForm(false);
                        setNewExercise({ name: '', category: 'грудь', photo_url: '' });
                    }
                }, "Отмена")
            )
        ),
        
        loading ? React.createElement('div', { className: "loading" }, "Загрузка упражнений...") :
        React.createElement('div', { className: "card" },
            exercises.map(exercise =>
                React.createElement('div', { key: exercise.id, className: "exercise-item" },
                    React.createElement('div', { className: "exercise-content" },
                        React.createElement('div', { className: "exercise-photo" },
                            exercise.photo_url ? 
                                React.createElement('img', {
                                    src: exercise.photo_url,
                                    alt: exercise.name,
                                    onError: (e) => { e.target.style.display = 'none'; }
                                }) :
                                React.createElement('div', {
                                    style: {
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: '#f3f4f6',
                                        borderRadius: '8px',
                                        fontSize: '32px',
                                        color: '#9ca3af'
                                    }
                                }, '💪')
                        ),
                        React.createElement('div', { className: "exercise-info" },
                            React.createElement('div', { className: "exercise-name" }, exercise.name),
                            React.createElement('span', { className: "category" }, exercise.category)
                        )
                    ),
                    React.createElement('button', { 
                        className: "button", 
                        style: {width: 'auto', padding: '8px 16px', fontSize: '14px'},
                        onClick: () => selectExercise(exercise)
                    }, "Выбрать")
                )
            )
        ),
        React.createElement('button', { className: "button", onClick: () => setScreen('main') }, "← Назад")
    );
};

// WorkoutScreen Component
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
    return React.createElement('div', { className: "container" },
        React.createElement('div', { className: "header" },
            React.createElement('div', { style: {display: 'flex', alignItems: 'center', marginBottom: '12px'} },
                React.createElement(ExerciseIcon, { 
                    photoUrl: selectedExercise.photo_url, 
                    size: 60,
                    style: {border: '2px solid #e5e7eb'}
                }),
                React.createElement('div', null,
                    React.createElement('h1', { style: {margin: 0} }, "💪 Тренировка"),
                    React.createElement('p', { style: {margin: '4px 0 0 0', fontSize: '18px', fontWeight: 'bold'} }, selectedExercise.name),
                    React.createElement('span', { className: "category" }, selectedExercise.category)
                )
            )
        ),
        error && React.createElement('div', { className: "error" }, error),
        success && React.createElement('div', { className: "success" }, success),
        
        savedSets.length > 0 && React.createElement('div', { className: "card" },
            React.createElement('h3', null, `Сохраненные подходы (${savedSets.length}):`),
            savedSets.map(set =>
                React.createElement('div', { 
                    key: set.id, 
                    style: {padding: '8px 0', borderBottom: '1px solid #e5e7eb'} 
                }, 
                    React.createElement('strong', null, `Подход ${set.set_number}:`),
                    ` ${set.reps} повторений, ${set.weight} ${set.weight === 'Собственный вес' ? '' : 'кг'}`
                )
            )
        ),
        
        React.createElement('div', { className: "card" },
            React.createElement('h3', null, "Добавить подход:"),
            React.createElement('div', { style: {margin: '16px 0'} },
                React.createElement('div', { style: {margin: '12px 0'} },
                    React.createElement('label', { style: {display: 'flex', alignItems: 'center', cursor: 'pointer'} },
                        React.createElement('input', {
                            type: "checkbox",
                            checked: useBodyweight,
                            onChange: (e) => setUseBodyweight(e.target.checked),
                            style: {marginRight: '8px'}
                        }),
                        "Собственный вес"
                    )
                ),
                !useBodyweight && React.createElement('input', {
                    type: "number",
                    placeholder: "Вес (кг)",
                    value: weight,
                    onChange: (e) => setWeight(e.target.value),
                    style: {marginBottom: '12px'}
                }),
                React.createElement('input', {
                    type: "number",
                    placeholder: "Количество повторений",
                    value: reps,
                    onChange: (e) => setReps(e.target.value)
                })
            ),
            React.createElement('div', { style: {display: 'flex', gap: '8px'} },
                React.createElement('button', { 
                    className: "button", 
                    onClick: addSet,
                    style: {flex: 1}
                }, "➕ Добавить подход"),
                React.createElement('button', { 
                    className: "button", 
                    onClick: finishWorkout, 
                    style: {flex: 1, background: '#ef4444'}
                }, "✅ Завершить тренировку")
            )
        )
    );
};

// HistoryScreen Component
const HistoryScreen = ({ workoutHistory, loading, loadWorkoutHistory }) => {
    return React.createElement('div', { className: "container" },
        React.createElement('div', { className: "header" },
            React.createElement('h1', null, "📊 История"),
            React.createElement('p', null, "Твои прошлые тренировки")
        ),
        loading ? React.createElement('div', { className: "loading" }, "Загрузка истории...") :
        workoutHistory.length === 0 ? React.createElement('div', { className: "card" },
            React.createElement('div', { className: "loading" }, "История тренировок пуста")
        ) :
        workoutHistory.map(day =>
            React.createElement('div', { key: day.date, className: "card", style: {marginBottom: '20px'} },
                React.createElement('div', { style: {display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'} },
                    React.createElement('h3', { style: {margin: 0, color: '#10b981'} },
                        new Date(day.date).toLocaleDateString('ru-RU', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                        })
                    ),
                    React.createElement('div', { style: {fontSize: '14px', color: '#6b7280'} },
                        `${day.totalSets} подходов, ${day.totalReps} повторений`
                    )
                ),
                day.exercises.map(exercise =>
                    React.createElement('div', { 
                        key: exercise.name, 
                        style: {padding: '12px', marginBottom: '8px', backgroundColor: '#f9fafb', borderRadius: '8px'} 
                    },
                        React.createElement('div', { style: {display: 'flex', alignItems: 'center', marginBottom: '8px'} },
                            React.createElement(ExerciseIcon, { photoUrl: exercise.photo_url, size: 40 }),
                            React.createElement('div', { style: {flex: 1, minWidth: 0} },
                                React.createElement('div', { style: {fontWeight: 'bold', fontSize: '16px', marginBottom: '2px'} }, exercise.name),
                                React.createElement('div', { style: {fontSize: '12px', color: '#6b7280'} },
                                    React.createElement('span', { className: "category" }, exercise.category)
                                )
                            ),
                            React.createElement('div', { style: {textAlign: 'right', marginLeft: '12px', flexShrink: 0} },
                                React.createElement('div', { style: {fontSize: '14px', fontWeight: 'bold', color: '#10b981'} }, exercise.maxWeight),
                                React.createElement('div', { style: {fontSize: '12px', color: '#6b7280'} }, `${exercise.totalSets}×${exercise.totalReps}`)
                            )
                        ),
                        React.createElement('div', { style: {fontSize: '12px', color: '#9ca3af', marginBottom: '4px', paddingLeft: '52px'} },
                            `Подходы: ${exercise.setsDetail}`
                        ),
                        React.createElement('div', { style: {fontSize: '11px', color: '#9ca3af', paddingLeft: '52px'} },
                            `Последний подход: ${new Date(exercise.lastSetTime).toLocaleTimeString('ru-RU', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}`
                        )
                    )
                )
            )
        ),
        React.createElement('button', { className: "button", onClick: () => setScreen('main') }, "← Назад")
    );
};

// StatsScreen Component
const StatsScreen = () => {
    return React.createElement('div', { className: "container" },
        React.createElement('div', { className: "header" },
            React.createElement('h1', null, "📈 Статистика"),
            React.createElement('p', null, "Твои достижения")
        ),
        React.createElement('div', { className: "card" },
            React.createElement('h3', null, "🏋️‍♂️ Общая статистика"),
            React.createElement('div', { style: {padding: '16px 0'} },
                React.createElement('div', { style: {display: 'flex', justifyContent: 'space-between', marginBottom: '12px'} },
                    React.createElement('span', null, "Всего тренировок:"),
                    React.createElement('strong', null, "12")
                ),
                React.createElement('div', { style: {display: 'flex', justifyContent: 'space-between', marginBottom: '12px'} },
                    React.createElement('span', null, "Всего подходов:"),
                    React.createElement('strong', null, "248")
                ),
                React.createElement('div', { style: {display: 'flex', justifyContent: 'space-between', marginBottom: '12px'} },
                    React.createElement('span', null, "Всего повторений:"),
                    React.createElement('strong', null, "1,856")
                ),
                React.createElement('div', { style: {display: 'flex', justifyContent: 'space-between'} },
                    React.createElement('span', null, "Активных дней:"),
                    React.createElement('strong', null, "8")
                )
            )
        ),
        React.createElement('button', { className: "button", onClick: () => setScreen('main') }, "← Назад")
    );
};
