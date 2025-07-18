import { Organization } from '@/payload-types'
import { Badge } from '@/shared'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/shared/components/ui/hover-card'

export function OrganizationCell({ organizations }: { organizations: Organization[] }) {
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

  return (
    <div className="flex flex-wrap gap-1">
      {visibleOrgs.map((org, index) => (
        <Badge key={index} variant="secondary" className="text-xs">
          {org.name}
        </Badge>
      ))}
      <HoverCard>
        <HoverCardTrigger asChild>
          <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">
            +{remainingCount} more
          </Badge>
        </HoverCardTrigger>
        <HoverCardContent className="w-80" side="top">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">All Organizations</h4>
            <div className="flex flex-wrap gap-1">
              {filterOrgs.map((org, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {org.name}
                </Badge>
              ))}
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  )
}
