import axios from "axios";
import type { AxiosError, AxiosRequestConfig } from "axios";

/**
 * 공통 axios 인스턴스
 * - 쿠키(HttpOnly at/rt) 전송을 위해 withCredentials: true
 * - 401이면 /web/reissue 한 번만 시도 후 원요청 1회 재시도
 * - 동시다발 401은 큐잉하여 중복 reissue 방지
 */
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

type RetryableConfig = AxiosRequestConfig & { _retry?: boolean };

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
        await api.post("/web/reissue");
        console.debug("[axios] reissue success → retry original:", config.url);

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
