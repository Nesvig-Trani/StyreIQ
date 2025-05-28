'use client'

import { ReadonlyURLSearchParams, useSearchParams as useNextSearchParams } from 'next/navigation'
import type { z } from 'zod'

export type SearchParamsObj = Record<string, string | string[] | undefined>

function urlSearchParamsToObj(
  searchParams: URLSearchParams | ReadonlyURLSearchParams,
): SearchParamsObj {
  const searchParamsObj: SearchParamsObj = {}
  for (const key of searchParams.keys()) {
    const value = searchParams.getAll(key)
    if (value.length === 1) {
      const v = value[0]
      if (v == null) {
        throw new Error(`Unexpected value for param '${key}'`)
      }

      searchParamsObj[key] = v
    } else if (value.length > 1) {
      searchParamsObj[key] = value
    }
  }

  return searchParamsObj
}

type ParsedSearchParamsValue =
  | string
  | number
  | boolean
  | Date
  | undefined
  | ParsedSearchParamsValue[]
  | { [key: string]: ParsedSearchParamsValue }

function parseSearchParamsValue(value: string): ParsedSearchParamsValue | null {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

type AllSearchParams =
  | URLSearchParams
  | ReadonlyURLSearchParams
  | SearchParamsObj
  | null
  | undefined

type ParsedSearchParams = Record<string | number | symbol, ParsedSearchParamsValue>

export function parseSearchParams(searchParams: AllSearchParams): ParsedSearchParams {
  if (searchParams == null) {
    return {}
  }

  let searchParamsObj: SearchParamsObj
  if (searchParams instanceof URLSearchParams || searchParams instanceof ReadonlyURLSearchParams) {
    searchParamsObj = urlSearchParamsToObj(searchParams)
  } else {
    searchParamsObj = searchParams
  }

  return Object.entries(searchParamsObj).reduce<ParsedSearchParams>((acc, [key, value]) => {
    if (value == null) return acc

    if (Array.isArray(value)) {
      acc[key] = value.reduce<ParsedSearchParamsValue[]>((parseAcc, v) => {
        const parsed = parseSearchParamsValue(v)
        if (parsed != null) {
          parseAcc.push(parsed)
        }
        return parseAcc
      }, [])
    } else {
      const parsed = parseSearchParamsValue(value)
      if (parsed != null) {
        acc[key] = parsed
      }
    }

    return acc
  }, {})
}

function stringifySearchParamsValue(value: ParsedSearchParams[string]): string | null {
  try {
    return JSON.stringify(value)
  } catch {
    return null
  }
}

export function stringifySearchParams(searchParams: ParsedSearchParams): string {
  const urlSearchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    if (value == null) continue

    const str = stringifySearchParamsValue(value)
    if (str != null && str !== '') {
      urlSearchParams.set(key, str)
    }
  }

  const queryString = urlSearchParams.toString()
  return queryString ? `?${queryString}` : ''
}

export function useParsedSearchParams<O, Z extends z.ZodSchema<O>>(schema: Z): z.output<Z> {
  const searchParams = useNextSearchParams()
  const parsedSearchParams = parseSearchParams(searchParams)
  return schema.parse(parsedSearchParams)
}
