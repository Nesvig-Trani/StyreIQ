import { ScrollArea } from '@/shared'

export const MetadataInfo = ({
  metadata,
}: {
  metadata: Record<string, string | number | object | undefined>
}) => {
  if (!metadata || Object.keys(metadata).length === 0) {
    return <div className="text-muted-foreground italic">No data</div>
  }

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm text-blue-700">Metadata</h4>
      <ScrollArea className="h-32 w-full rounded border bg-blue-50 p-3">
        <div className="space-y-1">
          {JSON.stringify(metadata, null, 2)
            .split('\n')
            .map((line, index) => (
              <div key={index} className="text-xs">
                {line}
              </div>
            ))}
        </div>
      </ScrollArea>
    </div>
  )
}
