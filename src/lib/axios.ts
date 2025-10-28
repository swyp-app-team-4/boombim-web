import axios from "axios";
import type { AxiosError, AxiosRequestConfig } from "axios";

/**
 * 공통 axios 인스턴스
 * - 쿠키(HttpOnly RT) 전송을 위해 withCredentials: true
 * - AT는 Authorization Bearer 헤더로 전송
 * - 401이면 /web/reissue로 AT 재발급 후 원요청 재시도
 * - 동시다발 401은 큐잉하여 중복 reissue 방지
 */
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

type RetryableConfig = AxiosRequestConfig & { _retry?: boolean };

// Access Token 저장소 (로컬 스토리지 사용)
const ACCESS_TOKEN_KEY = "boombim_access_token";

// Access Token 설정
export const setAccessToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};

// Access Token 가져오기
export const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

// 동시 요청 제어
let isRefreshing = false;
let waitQueue: Array<{
  resolve: (v?: any) => void;
  reject: (e?: any) => void;
}> = [];

const flushQueue = (err?: any) => {
  const q = [...waitQueue];
  waitQueue = [];
  q.forEach(({ resolve, reject }) => (err ? reject(err) : resolve()));
};

// 요청 인터셉터 - Authorization 헤더 자동 설정
api.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 401 처리 인터셉터
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const config = (error.config || {}) as RetryableConfig;
    const status = error.response?.status;
    const url = config.url || "";

    // 재발급 호출 자체에서 401 나면 더 시도하지 않음
    if (url.includes("/web/reissue")) {
      return Promise.reject(error);
    }

    if (status === 401 && !config._retry) {
      // 같은 요청은 1회만 재시도
      config._retry = true;

      // 이미 누군가 재발급 중이면 대기 → 끝나면 원 요청 재시도
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          waitQueue.push({ resolve, reject });
        }).then(() => api(config));
      }

      isRefreshing = true;

      try {
        // RT(HttpOnly)가 있으면 서버에서 AT 재발급
        console.debug("[axios] 401 detected → POST /web/reissue");
        const reissueResponse = await api.post("/web/reissue");
        console.debug("[axios] reissue success → retry original:", config.url);

        // 응답에서 새로운 AT 추출하여 저장
        const newAccessToken = reissueResponse.data.data.accessToken;
        setAccessToken(newAccessToken);
        console.debug("[axios] new access token set");

        flushQueue(); // 대기중인 요청들 깨우기
        return api(config);
      } catch (reissueErr) {
        console.warn("[axios] reissue failed");
        flushQueue(reissueErr);
        // 여기서 로그인 UI 노출 여부는 상위에서 판단(401 그대로 throw)
        return Promise.reject(reissueErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
