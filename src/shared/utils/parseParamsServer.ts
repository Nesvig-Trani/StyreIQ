import { z } from 'zod'

export function parseSearchParamsWithSchema<O, Z extends z.ZodSchema<O>>(
  rawParams: Record<string, string> | undefined,
  schema: Z,
): z.output<Z> {
  if (!rawParams) return schema.parse({})

  const parsedParams: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(rawParams)) {
    try {
      parsedParams[key] = Array.isArray(value) ? value : JSON.parse(decodeURIComponent(value))
    } catch {
      parsedParams[key] = value
    }
  }

  return schema.parse(parsedParams)
}
