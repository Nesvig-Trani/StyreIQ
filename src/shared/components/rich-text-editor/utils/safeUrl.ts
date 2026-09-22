const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i

export const toSafeUrl = (value: string): string | null => {
  const trimmed = value.trim()
  if (!trimmed) return null

  const candidate = HAS_SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    return ALLOWED_PROTOCOLS.has(new URL(candidate).protocol) ? candidate : null
  } catch {
    return null
  }
}

export const isSafeUrl = (value: string): boolean => toSafeUrl(value) !== null
