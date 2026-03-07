const EmptyState = ({ icon, title, description, action, onAction }) => {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 24px",
            textAlign: "center",
        }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
            <div style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#111827",
                marginBottom: 8,
            }}>
                {title}
            </div>
            <div style={{
                fontSize: 14,
                color: "#6B7280",
                marginBottom: 24,
                maxWidth: 320,
                lineHeight: 1.6,
            }}>
                {description}
            </div>
            {action && (
                <button
                    onClick={onAction}
                    style={{
                        padding: "8px 20px",
                        background: "#4F46E5",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: "pointer",
                    }}
                >
                    {action}
                </button>
            )}
        </div>
    );
};

export default EmptyState;