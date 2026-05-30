import { Organization } from '@/types/payload-types'
import { Badge } from '@/shared'
import { Button } from '@/shared/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'

export function UnitCell({
  organizations,
  expandLabelContext,
}: {
  organizations: Organization[]
  expandLabelContext?: string
}) {
  const maxVisible = 1
  const filterOrgs = organizations.filter((org) => org.name)
  const visibleOrgs = filterOrgs.slice(0, maxVisible)
  const remainingCount = filterOrgs.length - maxVisible

  if (filterOrgs.length <= maxVisible) {
    return (
      <div className="flex flex-wrap gap-1">
        {filterOrgs.map((org, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {org.name}
          </Badge>
        ))}
      </div>
    )
  }

  const expandLabel =
    remainingCount === 1 ? 'Show 1 more unit' : `Show ${remainingCount} more units`
  const expandAriaLabel = expandLabelContext
    ? `${expandLabel} for ${expandLabelContext}`
    : expandLabel

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visibleOrgs.map((org, index) => (
        <Badge key={index} variant="secondary" className="text-xs">
          {org.name}
        </Badge>
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-auto min-h-0 shrink-0 px-2 py-0.5 text-xs font-medium"
            aria-label={expandAriaLabel}
          >
            +{remainingCount} more
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" side="top" align="start">
          <div className="space-y-2">
            <p className="text-sm font-semibold leading-none">All units</p>
            <div className="flex flex-wrap gap-1">
              {filterOrgs.map((org, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {org.name}
                </Badge>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
