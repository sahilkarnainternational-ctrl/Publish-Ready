/** Trim env vars — Vercel paste often adds duplicate keys on new lines. */
export function cleanApiKey(value) {
  if (!value) return '';
  const first = String(value).trim().split(/\s+/)[0];
  return first.replace(/^Bearer\s+/i, '').trim();
}
