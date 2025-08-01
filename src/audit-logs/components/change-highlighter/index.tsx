import { collectionFieldLabels } from '@/audit-logs/constants/collectionFieldLabels'
import { ScrollArea } from '@/shared'

const isIsoDateString = (value: string | number | object) => {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    !isNaN(Date.parse(value))
  )
}

const formatValue = (value: string | number | object | undefined | null) => {
  if (value == null) return '—'
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value
        .map((v) => (typeof v === 'object' && v.name ? v.name : JSON.stringify(v)))
        .join(', ')
    } else {
      if ('name' in value) {
        return (value as { name: string }).name
      }
      return JSON.stringify(value)
    }
  }
  if (isIsoDateString(value)) {
    return new Date(value).toLocaleString()
  }
  return String(value)
}

export const ChangeHighlighter = ({
  prev,
  current,
  title,
}: {
  prev: Record<string, string | number | object | undefined>
  current: Record<string, string | number | object | undefined>
  title: string
}) => {
  if (!prev && !current) {
    return <div className="text-muted-foreground italic">No data</div>
  }

  if (prev && Object.keys(prev).length === 0 && current) {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-sm text-green-700">{title} (Created)</h4>
        <ScrollArea className="h-32 w-full rounded border bg-green-50 p-3">
          <div className="space-y-1">
            {Object.entries(current).map(([key, value]) =>
              collectionFieldLabels[key] ? (
                <div key={key} className="text-xs">
                  <span className="font-medium text-green-800">
                    {collectionFieldLabels[key] ?? key}:
                  </span>
                  <span className="bg-green-200 px-1 rounded">{formatValue(value)}</span>
                </div>
              ) : null,
            )}
          </div>
        </ScrollArea>
      </div>
    )
  }

  if (prev && !current) {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-sm text-red-700">{title} (Deleted)</h4>
        <ScrollArea className="h-32 w-full rounded border bg-red-50 p-3">
          <div className="space-y-1">
            {Object.entries(prev).map(([key, value]) =>
              collectionFieldLabels[key] ? (
                <div key={key} className="text-xs">
                  <span className="font-medium text-red-800">
                    {collectionFieldLabels[key] ?? key}:
                  </span>
                  <span className="bg-red-200 px-1 rounded line-through">{formatValue(value)}</span>
                </div>
              ) : null,
            )}
          </div>
        </ScrollArea>
      </div>
    )
  }

  if (prev && current) {
    const allKeys = new Set([...Object.keys(prev), ...Object.keys(current)])

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-sm text-blue-700">{title} (Updated)</h4>
        <ScrollArea className="h-32 w-full rounded border bg-blue-50 p-3">
          <div className="space-y-1">
            {Array.from(allKeys).map((key) => {
              if (!collectionFieldLabels[key]) {
                return null
              }

              const prevValue = prev[key]
              const currentValue = current[key]
              const hasChanged = JSON.stringify(prevValue) !== JSON.stringify(currentValue)

              if (!hasChanged) {
                return (
                  <div key={key} className="text-xs text-muted-foreground">
                    <span className="font-medium">{collectionFieldLabels[key]}:</span>{' '}
                    {formatValue(currentValue)}
                  </div>
                )
              }

              return (
                <div key={key} className="text-xs">
                  <span className="font-medium text-blue-800">{collectionFieldLabels[key]}:</span>
                  <div className="ml-4 space-y-1">
                    {prevValue !== undefined && (
                      <div>
                        <span className="text-red-600 text-xs">- </span>
                        <span className="bg-red-200 px-1 rounded line-through">
                          {formatValue(prevValue)}
                        </span>
                      </div>
                    )}
                    {currentValue !== undefined && (
                      <div>
                        <span className="text-green-600 text-xs">+ </span>
                        <span className="bg-green-200 px-1 rounded">
                          {formatValue(currentValue)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </div>
    )
  }

  return null
}
