export const sanitizeForPostgresJson = <T>(value: T): T => {
  if (typeof value === "string") {
    return value.replace(/\u0000/g, "") as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForPostgresJson(item)) as T;
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
        key,
        sanitizeForPostgresJson(nestedValue),
      ]),
    ) as T;
  }

  return value;
};
