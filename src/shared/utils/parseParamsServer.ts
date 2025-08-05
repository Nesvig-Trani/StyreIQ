import { z } from 'zod'

export function parseSearchParamsWithSchema<O, Z extends z.ZodSchema<O>>(
  rawParams: Record<string, string | string[] | undefined> | undefined,
  schema: Z,
): z.output<Z> {
  if (!rawParams) return schema.parse({})

  const parsedParams: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(rawParams)) {
    if (value === undefined) {
      parsedParams[key] = undefined
    } else if (Array.isArray(value)) {
      parsedParams[key] = value
    } else {
      try {
        parsedParams[key] = JSON.parse(decodeURIComponent(value))
      } catch {
        parsedParams[key] = value
      }
    }
  }

  return schema.parse(parsedParams)
}
