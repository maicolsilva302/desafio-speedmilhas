export function toPositiveInt(value: unknown): number | null {
  if (typeof value !== 'number') {
    return null;
  }

  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

export function toMoney(value: unknown): number | null {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) {
      return null;
    }

    return Math.round(value * 100) / 100;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : null;
}

export function toTrimmedString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  return trimmed === '' ? null : trimmed.slice(0, maxLength);
}
