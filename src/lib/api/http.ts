import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

export type ToastFn = (
  message: string,
  type?: "error" | "success" | "info",
) => void;

let toastFn: ToastFn = (m) => console.warn("[toast]", m);

export function setToastFn(fn: ToastFn) {
  toastFn = fn;
}

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080/api/v1";

export const http: AxiosInstance = axios.create({
  baseURL,
  timeout: 30_000,
});

// 从 cookie 读取 auth_token（auth-store.ts 将 token 镜像到 cookie，
// 这样浏览器端 axios 与 Edge runtime middleware 共享同一来源）
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(
      "(?:^|; )" +
        name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") +
        "=([^;]*)",
    ),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

// 请求拦截器：从 cookie 读取 auth_token 注入 Authorization
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = getCookie("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 响应拦截器：解包 Result<T>、401 跳登录、错误 Toast
http.interceptors.response.use(
  (response: AxiosResponse) => {
    const data = response.data;
    // 仅当 data 形如 {code, message, data} 时尝试解包
    if (
      data &&
      typeof data === "object" &&
      "code" in data &&
      "message" in data &&
      "data" in data
    ) {
      if (data.code === 0) {
        return data.data;
      }
      // 业务错误
      const message = data.message || "请求失败";
      toastFn(message, "error");
      return Promise.reject(new Error(message));
    }
    // 非 Result 结构，原样返回 data
    return data;
  },
  (error: AxiosError) => {
    if (typeof window !== "undefined") {
      const status = error.response?.status;
      if (status === 401) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        // 同步清除 cookie，让 middleware 立即看到已登出
        document.cookie = "auth_token=; path=/; max-age=0";
        document.cookie = "auth_role=; path=/; max-age=0";
        // 非 React 上下文（axios 拦截器），无法用 useRouter/redirect，必须用 location 跳转
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/auth";
        return Promise.reject(error);
      }
    }
    const message =
      (error.response?.data as { message?: string } | undefined)?.message ||
      error.message ||
      "网络异常，请稍后重试";
    toastFn(message, "error");
    return Promise.reject(error);
  },
);

// 便捷方法（已解包 data）
export function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return http.get(url, config) as unknown as Promise<T>;
}

export function apiPost<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  return http.post(url, data, config) as unknown as Promise<T>;
}

export function apiPut<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  return http.put(url, data, config) as unknown as Promise<T>;
}

export function apiDelete<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  return http.delete(url, config) as unknown as Promise<T>;
}
