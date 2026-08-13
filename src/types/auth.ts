import type { User } from "./user";

export type EmailCodePurpose = "REGISTER" | "RESET_PASSWORD";

export interface SendCodeDTO {
  email: string;
  purpose: EmailCodePurpose;
}

export interface RegisterDTO {
  email: string;
  code: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface LoginVO {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}
