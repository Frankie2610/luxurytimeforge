export function asList<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value.filter(Boolean) as T[];
  if (value && typeof value === 'object') return Object.values(value as Record<string, T>).filter(Boolean);
  return [];
}

export function asStringList(value: unknown): string[] {
  return asList<unknown>(value)
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}
