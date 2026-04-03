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

export const env = {
  BOT_TOKEN: requireEnv("BOT_TOKEN"),
  DATABASE_URL: requireEnv("DATABASE_URL"),
  SUPERADMIN_ID: parseBigIntEnv("SUPERADMIN_ID")
};
