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
        return (
            <img 
                src={photoUrl} 
                alt="Exercise"
                style={{
                    ...iconStyle,
                    objectFit: 'cover'
                }}
            />
        );
    }

    return (
        <div style={{
            ...iconStyle,
            backgroundColor: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${size * 0.45}px`,
            color: '#9ca3af'
        }}>
            💪
        </div>
    );
};

export default ExerciseIcon;
