import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import TopNav from "../components/TopNav";
import LoginModal from "../components/LoginModal";

export default function Home() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleGetStarted = () => {
    if (auth?.isAuthed) {
      navigate("/map");
    } else {
      setShowLoginModal(true);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <TopNav />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 80px)",
          padding: "40px 20px",
          textAlign: "center",
        }}
      >
        {/* 메인 타이틀 */}
        <div style={{ marginBottom: "40px" }}>
          <h1
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "16px",
              lineHeight: 1.2,
            }}
          >
            BSM BIM
          </h1>
          <p
            style={{
              fontSize: "20px",
              color: "#6b7280",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            건물 정보 모델링을 통한 스마트한 공간 관리
          </p>
        </div>

        {/* 주요 기능 소개 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "24px",
            marginBottom: "48px",
            maxWidth: "800px",
            width: "100%",
          }}
        >
          <div
            style={{
              padding: "24px",
              background: "#f9fafb",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                fontSize: "32px",
                marginBottom: "12px",
              }}
            >
              🗺️
            </div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#1f2937",
                marginBottom: "8px",
              }}
            >
              인터랙티브 지도
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#6b7280",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              실시간 지도에서 건물과 공간을 확인하고 관리하세요
            </p>
          </div>

          <div
            style={{
              padding: "24px",
              background: "#f9fafb",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                fontSize: "32px",
                marginBottom: "12px",
              }}
            >
              📍
            </div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#1f2937",
                marginBottom: "8px",
              }}
            >
              장소 관리
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#6b7280",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              공식 장소와 사용자 장소를 효율적으로 분류하고 관리
            </p>
          </div>

          <div
            style={{
              padding: "24px",
              background: "#f9fafb",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                fontSize: "32px",
                marginBottom: "12px",
              }}
            >
              🔍
            </div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#1f2937",
                marginBottom: "8px",
              }}
            >
              스마트 검색
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#6b7280",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              원하는 장소를 빠르게 찾고 상세 정보를 확인하세요
            </p>
          </div>
        </div>

        {/* 시작하기 버튼 */}
        <button
          onClick={handleGetStarted}
          style={{
            background: "#f97316",
            color: "white",
            border: "none",
            borderRadius: "12px",
            padding: "16px 32px",
            fontSize: "18px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 4px 12px rgba(249, 115, 22, 0.3)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#ea580c";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow =
              "0 6px 16px rgba(249, 115, 22, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#f97316";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 4px 12px rgba(249, 115, 22, 0.3)";
          }}
        >
          {auth?.isAuthed ? "지도 보기" : "시작하기"}
        </button>
      </div>

      {/* 로그인 모달 */}
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </div>
  );
}
