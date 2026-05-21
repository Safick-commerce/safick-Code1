// UUID v4 validation for route params (profiles.id is Postgres uuid).

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value.trim());
}

/** Returns normalized lowercase UUID or null if invalid. */
export function parseUuid(value: string): string | null {
  const trimmed = value.trim();
  return isValidUuid(trimmed) ? trimmed.toLowerCase() : null;
}
