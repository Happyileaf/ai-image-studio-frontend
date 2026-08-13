export type UserRole = "USER" | "ADMIN";

export type UserStatus = 0 | 1; // 0 禁用 1 正常

export interface User {
  id: number;
  email: string;
  nickname?: string;
  role: UserRole;
  quota: number;
  status: UserStatus;
  createdAt: string;
}

export interface UserVO extends User {
  plan?: string;
  lastLoginAt?: string;
}
