import crypto from "node:crypto";
import { Role, type Prisma, type User } from "@prisma/client";
import type { Context } from "grammy";
import { prisma } from "../db/prisma";

export function generateReferralToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export async function getOrCreateReferralToken(adminId: number): Promise<string> {
  const existing = await prisma.referralToken.findUnique({ where: { adminId } });
  if (existing) {
    return existing.token;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = generateReferralToken();
    try {
      const created = await prisma.referralToken.create({
        data: {
          token,
          adminId
        }
      });
      return created.token;
    } catch (error) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      if (prismaError?.code !== "P2002") {
        throw error;
      }
    }
  }

  throw new Error("Unable to generate unique referral token after multiple attempts.");
}

export function buildReferralLink(botUsername: string, token: string): string {
  return `https://t.me/${botUsername}?start=${token}`;
}

export async function resolveAdminByReferralToken(token: string): Promise<User | null> {
  const referral = await prisma.referralToken.findUnique({
    where: { token },
    include: { admin: true }
  });

  if (!referral) {
    return null;
  }

  if (referral.admin.role !== Role.ADMIN && referral.admin.role !== Role.SUPERADMIN) {
    return null;
  }

  return referral.admin;
}

export async function syncUserFromContext(ctx: Context): Promise<User> {
  if (!ctx.from) {
    throw new Error("Missing ctx.from for user sync.");
  }

  const telegramId = BigInt(ctx.from.id);

  return prisma.user.upsert({
    where: { telegramId },
    update: {
      username: ctx.from.username ?? null,
      firstName: ctx.from.first_name ?? null,
      lastName: ctx.from.last_name ?? null
    },
    create: {
      telegramId,
      username: ctx.from.username ?? null,
      firstName: ctx.from.first_name ?? null,
      lastName: ctx.from.last_name ?? null,
      role: Role.USER
    }
  });
}
