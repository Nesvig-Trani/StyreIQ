const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readMessage = (source: unknown): string | undefined => {
  if (typeof source === 'string') return source || undefined
  if (!isRecord(source)) return undefined

  // Payload core endpoints reply with `{ errors: [{ message }] }`; custom endpoints with `{ error }`.
  if (Array.isArray(source.errors)) {
    const [first] = source.errors
    if (isRecord(first) && typeof first.message === 'string' && first.message) {
      return first.message
    }
  }

  if (typeof source.error === 'string' && source.error) return source.error

  const fromData = readMessage(source.data)
  if (fromData) return fromData

  if (typeof source.message === 'string' && source.message) return source.message

  return undefined
}

export const getErrorMessage = (error: unknown, fallback: string): string =>
  readMessage(error) ?? fallback
