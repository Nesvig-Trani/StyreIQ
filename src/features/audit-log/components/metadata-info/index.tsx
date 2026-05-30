'use client'

import { useId } from 'react'

const MAX_NESTING_DEPTH = 8

const isIsoDateString = (value: unknown): value is string => {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    !Number.isNaN(Date.parse(value))
  )
}

const humanizeKey = (key: string) =>
  key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^\w/, (c) => c.toUpperCase())

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function formatScalar(value: string | number | boolean): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return String(value)
  if (isIsoDateString(value)) return new Date(value).toLocaleString()
  return value
}

function isEmptyMetadata(value: unknown): boolean {
  if (value == null) return true
  if (Array.isArray(value)) return value.length === 0
  if (isPlainObject(value)) return Object.keys(value).length === 0
  return false
}

function MetadataValue({ value, depth }: { value: unknown; depth: number }) {
  if (depth > MAX_NESTING_DEPTH) {
    return <span className="break-all text-muted-foreground">{JSON.stringify(value)}</span>
  }

  if (value == null) {
    return <span className="text-muted-foreground">—</span>
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return <span className="wrap-break-word">{formatScalar(value)}</span>
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground">—</span>
    }
    return (
      <ol className="mt-1 list-decimal space-y-2 pl-4">
        {value.map((item, index) => (
          <li key={index} className="pl-1">
            <MetadataValue value={item} depth={depth + 1} />
          </li>
        ))}
      </ol>
    )
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value)
    if (entries.length === 0) {
      return <span className="text-muted-foreground">—</span>
    }
    return (
      <dl className="mt-1 space-y-2 border-l border-blue-200 pl-3">
        {entries.map(([key, nested]) => (
          <div key={key}>
            <dt className="font-medium text-blue-900">{humanizeKey(key)}</dt>
            <dd className="mt-0.5">
              <MetadataValue value={nested} depth={depth + 1} />
            </dd>
          </div>
        ))}
      </dl>
    )
  }

  return <span className="break-all">{String(value)}</span>
}

function MetadataBody({ value, depth }: { value: unknown; depth: number }) {
  if (isPlainObject(value)) {
    const entries = Object.entries(value)
    return (
      <>
        {entries.map(([key, nested]) => (
          <div key={key}>
            <dt className="font-medium text-blue-900">{humanizeKey(key)}</dt>
            <dd className="mt-0.5">
              <MetadataValue value={nested} depth={depth} />
            </dd>
          </div>
        ))}
      </>
    )
  }

  if (Array.isArray(value)) {
    return (
      <>
        <div>
          <dt className="font-medium text-blue-900">Items</dt>
          <dd>
            <MetadataValue value={value} depth={depth} />
          </dd>
        </div>
      </>
    )
  }

  return (
    <div>
      <dt className="font-medium text-blue-900">Value</dt>
      <dd>
        <MetadataValue value={value} depth={depth} />
      </dd>
    </div>
  )
}

export const MetadataInfo = ({
  metadata,
  auditLogId,
}: {
  metadata: unknown
  auditLogId: number
}) => {
  const reactId = useId()
  const headingId = `${reactId}-metadata-heading`
  const eventDescId = `${reactId}-metadata-event-desc`

  if (isEmptyMetadata(metadata)) {
    return <div className="text-muted-foreground italic">No data</div>
  }

  return (
    <section className="space-y-2">
      <h3 id={headingId} className="font-medium text-sm text-blue-700">
        Metadata
      </h3>
      <p id={eventDescId} className="sr-only">
        Audit log metadata for event {auditLogId}
      </p>
      <div
        tabIndex={0}
        role="region"
        aria-labelledby={headingId}
        aria-describedby={eventDescId}
        className="h-32 max-h-32 w-full overflow-y-auto rounded-md border border-blue-200 bg-blue-50 p-3 text-xs focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <dl className="space-y-2">
          <MetadataBody value={metadata} depth={1} />
        </dl>
      </div>
    </section>
  )
}
