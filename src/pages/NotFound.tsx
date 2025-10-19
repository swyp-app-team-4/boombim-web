import { useNavigate } from "react-router-dom";
import NotFoundNumber from "../assets/404-number.svg";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 404 숫자 SVG와 겹치는 텍스트 */}
      <div
        style={{
          position: "relative",
          marginBottom: "40px",
        }}
      >
        {/* 404 숫자 SVG */}
        <img
          src={NotFoundNumber}
          alt="404"
          style={{
            width: "400px",
            height: "300px",
            objectFit: "contain",
          }}
        />

        {/* 에러 메시지 - SVG 위로 겹치게 */}
        <div
          style={{
            position: "absolute",
            bottom: "-40px", // 더 아래로 이동
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            background: "#ffffff",
            padding: "20px 30px",
            width: "500px", // 가로 넓이 증가
            borderTop: "1px solid #EAEBEC", // 404 SVG와 같은 색상의 상단 선, 더 얇게
            zIndex: 2,
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#374151",
              marginBottom: "12px",
            }}
          >
            페이지를 찾을 수 없습니다.
          </h2>
          <p
            style={{
              fontSize: "16px",
              color: "#6b7280",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            요청하신 페이지가 이동되었거나 삭제된 것 같아요.
            <br />
            홈으로 돌아가 다시 시도해주세요.
          </p>
        </div>
      </div>

      {/* 홈으로 돌아가기 버튼 */}
      <button
        onClick={() => navigate("/")}
        style={{
          background: "#f97316",
          color: "white",
          border: "none",
          borderRadius: "8px",
          padding: "12px 24px",
          fontSize: "16px",
          fontWeight: "500",
          cursor: "pointer",
          transition: "background-color 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#ea580c";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#f97316";
        }}
      >
        홈으로 돌아가기
      </button>
    </div>
  );
}
