import { apiGet, apiPut } from "./http";
import type { ChangePasswordDTO, User } from "@/types";

export function getMe(): Promise<User> {
  return apiGet<User>("/users/me");
}

export function changePassword(dto: ChangePasswordDTO): Promise<void> {
  return apiPut("/users/me/password", dto);
}
