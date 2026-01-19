type ClassValue = string | number | boolean | object | null | undefined;

function toClassName(value: ClassValue): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(toClassName).filter(Boolean).join(" ");
  }

  if (value && typeof value === "object") {
    return Object.entries(value)
      .filter(([, condition]) => Boolean(condition))
      .map(([className]) => className)
      .join(" ");
  }

  return "";
}

function mergeTailwindClasses(classNames: string): string {
  const tokens = classNames.trim().split(/\s+/);
  const seen = new Set<string>();
  const result: string[] = [];

  for (let index = tokens.length - 1; index >= 0; index -= 1) {
    const token = tokens[index];

    if (!token) {
      continue;
    }

    if (seen.has(token)) {
      continue;
    }

    seen.add(token);
    result.unshift(token);
  }

  return result.join(" ");
}

export function cn(...inputs: ClassValue[]): string {
  const classNames = inputs.map(toClassName).filter(Boolean).join(" ");
  return mergeTailwindClasses(classNames);
}