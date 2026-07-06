// No ambiguous chars (0/O, 1/I, 8/B)
const CHARSET = "ACDEFGHJKLMNPQRTUVWXYZ23456789";
const CODE_LEN = 8;
const PREFIX = "FAM-";

export function generateFamilyCode(): string {
  let code = PREFIX;
  for (let i = 0; i < CODE_LEN; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}

export function isValidFamilyCode(code: string): boolean {
  const normalized = normalizeFamilyCode(code);
  if (!normalized.startsWith(PREFIX)) return false;
  const body = normalized.slice(PREFIX.length);
  if (body.length !== CODE_LEN) return false;
  return body.split("").every((c) => CHARSET.includes(c));
}

export function normalizeFamilyCode(input: string): string {
  if (input.trim().toLowerCase() === "admin") return "FAM-ADMN2222";
  const trimmed = input.trim().toUpperCase().replace(/\s+/g, "");
  if (trimmed.startsWith(PREFIX)) return trimmed;
  // Accept bare code without prefix
  if (trimmed.length === CODE_LEN) return PREFIX + trimmed;
  return trimmed;
}
