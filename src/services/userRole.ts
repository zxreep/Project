import { Role, type User } from "@prisma/client";
import { env } from "../config/env";

export function resolveRole(telegramId: bigint, existingUser: User | null): Role {
  if (telegramId === env.SUPERADMIN_ID) {
    return Role.SUPERADMIN;
  }

  if (!existingUser) {
    return Role.USER;
  }

  if (existingUser.role === Role.SUPERADMIN) {
    return Role.USER;
  }

  return existingUser.role;
}

export function humanRole(role: Role): "user" | "admin" | "superadmin" {
  if (role === Role.SUPERADMIN) {
    return "superadmin";
  }

  if (role === Role.ADMIN) {
    return "admin";
  }

  return "user";
}
