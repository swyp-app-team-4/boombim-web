import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import api, { setAccessToken } from "../lib/axios";

type User = {
  name: string;
  profile: string;
  email: string;
  socialProvider: "KAKAO" | "NAVER";
} | null;

type AuthContextType = {
  user: User;
  isAuthed: boolean;
  loading: boolean;
  checkMe: () => Promise<void>;
  startOauthPopup: (provider: "kakao" | "naver") => Promise<"success" | "fail">;
  logout: () => Promise<void>;
};

type ApiEnvelope<T> = {
  code: number;
  status: string;
  message: string;
  data: T;
};
type RawMe = {
  name: string;
  profile: string;
  email: string;
  socialProvider: "KAKAO" | "NAVER";
  voteCnt: number;
  questionCnt: number;
};

function mapRawMeToUser(raw: RawMe) {
  return {
    name: raw.name,
    profile: raw.profile,
    socialProvider: raw.socialProvider,
    email: raw.email,
    voteCnt: raw.voteCnt,
    questionCnt: raw.questionCnt,
  };
}

export const AuthContext = createContext<AuthContextType | null>(null);

function openCenteredPopup(url: string, title: string, w = 480, h = 640) {
  const dualLeft = (window as any).screenLeft ?? (window as any).screenX ?? 0;
  const dualTop = (window as any).screenTop ?? (window as any).screenY ?? 0;
  const vw =
    window.innerWidth ?? document.documentElement.clientWidth ?? screen.width;
  const vh =
    window.innerHeight ??
    document.documentElement.clientHeight ??
    screen.height;
  const left = dualLeft + vw / 2 - w / 2;
  const top = dualTop + vh / 2 - h / 2;
  return window.open(
    url,
    title,
    `width=${w},height=${h},left=${left},top=${top},scrollbars=yes`
  );
}

/**
 * OAuth 팝업에서 postMessage로 알려주는 성공/실패를 기다림.
 * - origin이 주어지면 해당 origin만 수신
 * - 성공/실패 시 리스너 제거
 * - 호출 측에서 타임아웃을 걸었다면, 타임아웃 이후 cleanup() 호출 필요
 */
function createOauthResultWaiter(origin?: string) {
  let resolved = false;
  let handler: ((e: MessageEvent) => void) | null = null;

  const promise = new Promise<"success" | "fail">((resolve) => {
    handler = (e: MessageEvent) => {
      if (origin && e.origin !== origin) return;
      if (typeof e.data !== "object" || !e.data) return;
      if (e.data?.type === "oauth:success") {
        cleanup();
        resolved = true;
        resolve("success");
      } else if (e.data?.type === "oauth:fail") {
        cleanup();
        resolved = true;
        resolve("fail");
      }
    };
    window.addEventListener("message", handler);
  });

  const cleanup = () => {
    if (handler) {
      window.removeEventListener("message", handler);
      handler = null;
    }
  };

  return {
    promise,
    cleanup,
    get resolved() {
      return resolved;
    },
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(false);

  const checkMe = useCallback(async () => {
    console.log("checkMe 호출됨");
    setLoading(true);
    try {
      const res = await api.get<ApiEnvelope<RawMe>>("/web/auth/me");
      console.log("checkMe 성공:", res.data.data);
      setUser(mapRawMeToUser(res.data.data));
    } catch (error: any) {
      console.log("checkMe 실패:", error);
      // 401 에러인 경우에만 로그인 필요로 처리
      if (error.response?.status === 401) {
        console.log("401 에러 - 로그인 필요");
        setUser(null);
      } else {
        console.log("기타 에러:", error);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const reissueAndCheckMe = useCallback(async () => {
    console.log("reissueAndCheckMe 호출됨");
    setLoading(true);
    try {
      // 먼저 reissue로 AT 발급
      console.log("reissue 요청 중...");
      const reissueResponse = await api.post("/web/reissue");
      const newAccessToken = reissueResponse.data.data.accessToken;
      setAccessToken(newAccessToken);
      console.log("reissue 성공, AT 저장됨");

      // 그 다음 사용자 정보 조회
      const res = await api.get<ApiEnvelope<RawMe>>("/web/auth/me");
      console.log("checkMe 성공:", res.data.data);
      setUser(mapRawMeToUser(res.data.data));
    } catch (error: any) {
      console.log("reissueAndCheckMe 실패:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 앱 최초 진입 시 로그인 여부 확인
    checkMe();
  }, []); // checkMe 의존성 제거

  const startOauthPopup = useCallback(
    async (provider: "kakao" | "naver"): Promise<"success" | "fail"> => {
      const popup = openCenteredPopup(
        `/api/web/oauth2/login/${provider}`,
        "OAuth Login"
      );
      if (!popup) {
        alert("팝업 차단을 해제해 주세요.");
        return "fail";
      }

      // 메시지 대기자 생성
      const waiter = createOauthResultWaiter(window.location.origin);

      // 안전장치: 2분 타임아웃
      const timeout = new Promise<"fail">((r) =>
        setTimeout(() => r("fail"), 120_000)
      );

      const result = await Promise.race([waiter.promise, timeout]);

      // 타임아웃으로 끝났다면 리스너 정리
      if (!waiter.resolved) waiter.cleanup();

      try {
        popup.close();
      } catch {
        // ignore
      }

      if (result === "success") {
        await reissueAndCheckMe(); // 바로 reissue 후 사용자 정보 조회
      }
      return result;
    },
    [reissueAndCheckMe]
  );

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await api.post("/web/oauth2/logout");
    } catch {
      // ignore (실패해도 클라이언트 상태는 정리)
    } finally {
      setLoading(false);
      setUser(null);
      setAccessToken(null); // AT 제거
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthed: !!user,
      loading,
      checkMe,
      startOauthPopup,
      logout,
    }),
    [user, loading, checkMe, startOauthPopup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
