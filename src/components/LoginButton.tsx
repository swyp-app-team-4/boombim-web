type Props = {
  onClick?: () => void;
};

export default function LoginButton({ onClick }: Props) {
  return (
    <button
      className="login-btn"
      onClick={onClick}
      style={{
        background: "transparent",
        border: "1px solid #e5e5e5",
        color: "#666",
        padding: "8px 16px",
        borderRadius: "6px",
        fontSize: "14px",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#ccc";
        e.currentTarget.style.color = "#333";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#e5e5e5";
        e.currentTarget.style.color = "#666";
      }}
    >
      로그인
    </button>
  );
}
