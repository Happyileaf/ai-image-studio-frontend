import { apiPost } from "./http";
import type {
  LoginDTO,
  LoginVO,
  RegisterDTO,
  SendCodeDTO,
} from "@/types";

export function sendCode(dto: SendCodeDTO): Promise<{ expireIn: number }> {
  return apiPost("/auth/send-code", dto);
}

export function register(dto: RegisterDTO): Promise<LoginVO> {
  return apiPost("/auth/register", dto);
}

export function login(dto: LoginDTO): Promise<LoginVO> {
  return apiPost("/auth/login", dto);
}

export function refresh(refreshToken: string): Promise<{ accessToken: string }> {
  return apiPost("/auth/refresh", { refreshToken });
}

export function logout(): Promise<void> {
  return apiPost("/auth/logout");
}
