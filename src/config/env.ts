import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parseBigIntEnv(name: string): bigint {
  const value = requireEnv(name);

  try {
    return BigInt(value);
  } catch {
    throw new Error(`Environment variable ${name} must be a valid integer Telegram user id.`);
  }
}

function parsePort(): number {
  const raw = process.env.PORT ?? "10000";
  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error("Environment variable PORT must be a valid TCP port number (1-65535).");
  }

  return parsed;
}

export const env = {
  BOT_TOKEN: requireEnv("BOT_TOKEN"),
  DATABASE_URL: requireEnv("DATABASE_URL"),
  SUPERADMIN_ID: parseBigIntEnv("SUPERADMIN_ID"),
  PORT: parsePort()
};
