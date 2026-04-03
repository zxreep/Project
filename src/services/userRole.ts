import { Role, type User } from "@prisma/client";

export function resolveRole(telegramId: bigint, superadminId: bigint, existingUser: User | null): Role {
  if (telegramId === superadminId) {
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

export function humanRole(role: Role): "user" | "admin" | "moderator" | "superadmin" {
  if (role === Role.SUPERADMIN) {
    return "superadmin";
  }

  if (role === Role.ADMIN) {
    return "admin";
  }

  if (role === Role.MODERATOR) {
    return "moderator";
  }

  return "user";
}
