import { Organization } from '@/payload-types'
import { Badge } from '@/shared'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/shared/components/ui/hover-card'

export function OrganizationCell({ organizations }: { organizations: Organization[] }) {
  const maxVisible = 1
  const visibleOrgs = organizations.slice(0, maxVisible)
  const remainingCount = organizations.length - maxVisible

  if (organizations.length <= maxVisible) {
    return (
      <div className="flex flex-wrap gap-1">
        {organizations.map((org, index) => (
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
              {organizations.map((org, index) => (
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
