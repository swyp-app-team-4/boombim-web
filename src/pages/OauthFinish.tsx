import { useEffect } from "react";

export default function OauthFinish() {
  useEffect(() => {
    try {
      if (window.opener) {
        window.opener.postMessage(
          { type: "oauth:success" },
          window.location.origin
        );
      }
    } finally {
      window.close();
    }
  }, []);

  return (
    <div style={{ padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 18, marginBottom: 8 }}>로그인 처리 완료</h1>
      <p style={{ marginBottom: 12 }}>
        창이 자동으로 닫히지 않으면 아래 버튼을 눌러 주세요.
      </p>
      <button onClick={() => window.close()}>창 닫기</button>
    </div>
  );
}
