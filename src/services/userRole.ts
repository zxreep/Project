export type UserRole = "USER" | "ADMIN" | "SUPERADMIN";

interface MinimalUser {
  role?: UserRole | null;
}

export function resolveRole(telegramId: bigint, superadminId: bigint, existingUser: MinimalUser | null): UserRole {
  if (telegramId === superadminId) {
    return "SUPERADMIN";
  }

  if (!existingUser?.role) {
    return "USER";
  }

  if (existingUser.role === "SUPERADMIN") {
    return "USER";
  }

  return existingUser.role;
}

export function humanRole(role: string | null | undefined): "user" | "admin" | "superadmin" {
  if (role === "SUPERADMIN") {
    return "superadmin";
  }

  if (role === "ADMIN") {
    return "admin";
  }

  return "user";
}
