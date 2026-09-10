/**
 * Tiny server-side input validation (MASTER.md §11). Kept dependency-free — the
 * Phase 1B/1C inputs are small. Throws {@link ValidationError} on bad input;
 * route handlers convert that to a 400.
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function asObject(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ValidationError("Expected a JSON object.");
  }
  return body as Record<string, unknown>;
}

type StrOpts = { min?: number; max?: number; field: string };

export function requiredString(value: unknown, opts: StrOpts): string {
  if (typeof value !== "string") throw new ValidationError(`${opts.field} is required.`);
  const trimmed = value.trim();
  const min = opts.min ?? 1;
  if (trimmed.length < min) throw new ValidationError(`${opts.field} is required.`);
  if (opts.max && trimmed.length > opts.max) {
    throw new ValidationError(`${opts.field} must be ${opts.max} characters or fewer.`);
  }
  return trimmed;
}

export function optionalString(value: unknown, opts: StrOpts): string | null {
  if (value === undefined || value === null || value === "") return null;
  return requiredString(value, opts);
}

const MAX_NOTE_TEXT = 200_000;

/** Note body: any string incl. empty; whitespace/newlines preserved (not trimmed). */
export function noteText(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") throw new ValidationError("Note text must be a string.");
  if (value.length > MAX_NOTE_TEXT) {
    throw new ValidationError("Note is too long.");
  }
  return value;
}

const HEX_COLOUR = /^#[0-9a-fA-F]{6}$/;

export function optionalColour(value: unknown, field = "colour"): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !HEX_COLOUR.test(value)) {
    throw new ValidationError(`${field} must be a hex colour like #7C3AED.`);
  }
  return value.toUpperCase();
}
