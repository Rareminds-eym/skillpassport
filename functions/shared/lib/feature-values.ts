/** Invalid configuration must never be treated as a legacy grant or a default selected value. */
export class EnumConfigurationError extends Error {
  constructor() { super('Enum entitlement configuration is invalid'); this.name = 'EnumConfigurationError'; }
}

export function enumOptions(value: unknown): readonly string[] {
  if (!Array.isArray(value) || !value.length) throw new EnumConfigurationError();
  const options = Array.from(value, (option: unknown) => {
    if (typeof option !== 'string' || !/^[a-z][a-z0-9_]*$/.test(option)) throw new EnumConfigurationError();
    return option;
  });
  if (new Set(options).size !== options.length) throw new EnumConfigurationError();
  return Object.freeze(options);
}

/** Missing entitlement rows mean no grant. Existing rows require explicit, coherent terms. */
export function enumGrant(options: readonly string[], row: unknown): string | null {
  if (row === undefined) return null;
  if (!row || typeof row !== 'object' || Array.isArray(row)) throw new EnumConfigurationError();
  const terms = row as Record<string, unknown>;
  if (typeof terms.is_enabled !== 'boolean' || terms.value_numeric !== null) throw new EnumConfigurationError();
  if (!terms.is_enabled) {
    if (terms.value_text !== null) throw new EnumConfigurationError();
    return null;
  }
  if (typeof terms.value_text !== 'string' || !options.includes(terms.value_text)) throw new EnumConfigurationError();
  return terms.value_text;
}
