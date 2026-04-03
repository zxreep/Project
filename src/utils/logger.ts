export type LogLevel = "debug" | "info" | "warn" | "error";

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return { error };
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const payload: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    message
  };

  if (meta && Object.keys(meta).length > 0) {
    payload.meta = meta;
  }

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>): void => log("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>): void => log("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>): void => log("warn", message, meta),
  error: (message: string, error?: unknown, meta?: Record<string, unknown>): void => {
    const errorMeta = error === undefined ? {} : { error: serializeError(error) };
    log("error", message, { ...meta, ...errorMeta });
  }
};
