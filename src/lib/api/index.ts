export { http, apiGet, apiPost, apiPut, apiDelete, setToastFn } from "./http";
export type { ToastFn } from "./http";
export * from "./auth";
export * from "./images";
export * from "./styles";
export * from "./tasks";
export * from "./history";
export * from "./users";
export * from "./admin";

// 注册 mock（内部自判 NEXT_PUBLIC_USE_MOCK 开关）
import "./mock";
