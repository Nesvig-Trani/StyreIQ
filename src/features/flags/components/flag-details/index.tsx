import { flagSourceLabels } from '@/features/flags/constants/flagSourceLabels'
import { FlagSourceEnum, FlagStatusEnum } from '@/features/flags/schemas'
import { getStatusColor, isActivityStale } from '@/features/flags/utils'
import { Flag, Organization, SocialMedia, User } from '@/types/payload-types'
import { Badge, Button, Separator } from '@/shared'
import {
  Dialog,
  DialogTrigger,
  DialogTitle,
  DialogHeader,
  DialogContent,
} from '@/shared/components/ui/dialog'
import {
  AlertTriangle,
  Building2Icon,
  CalendarIcon,
  ClockIcon,
  EditIcon,
  EyeIcon,
} from 'lucide-react'
import { ViewSocialMedia } from '../view-social-media'
import { ViewUser } from '../view-user'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { UnitCell } from '@/features/organizations/components/unit-cell'

export function FlagDetails({ flag }: { flag: Flag }) {
  const searchParams = useSearchParams()
  const currentFilters = searchParams.toString()

  const renderActions = () => {
    const entity = flag.affectedEntity
    const relation = entity?.relationTo
    const value = entity?.value

    if (!value || typeof value !== 'object') return null

    switch (relation) {
      case 'social-medias':
        const social = value as SocialMedia

        return (
          <>
            <ViewSocialMedia account={social} />
            <Link
              href={`/dashboard/social-media-accounts/update/${social.id}?returnTo=${encodeURIComponent(`/dashboard/flags?${currentFilters}`)}`}
            >
              <Button variant="outline">
                <EditIcon className="h-4 w-4 mr-2" />
                Edit Account
              </Button>
            </Link>
          </>
        )
      case 'users':
        const user = value as User

        return (
          <>
            <ViewUser user={user} />
            <Link
              href={`/dashboard/users/update/${user.id}?returnTo=${encodeURIComponent(`/dashboard/flags?${currentFilters}`)}`}
            >
              <Button variant="outline">
                <EditIcon className="h-4 w-4 mr-2" />
                Edit Account
              </Button>
            </Link>
          </>
        )
      default:
        return null
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <EyeIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="!max-w-4xl max-h-[80vh] w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Risk Flag Details
          </DialogTitle>
        </DialogHeader>

        {flag && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Risk Flag Type</h4>
                <p className="text-sm">{flag.flagType}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Flag Status</h4>
                <Badge variant={getStatusColor(flag.status as FlagStatusEnum)}>{flag.status}</Badge>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Affected Entity</h4>
                <p className="text-sm">
                  {flag &&
                    typeof flag.affectedEntity?.value === 'object' &&
                    flag.affectedEntity.value.name}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Organizational Unit</h4>
                <div className="flex items-center gap-1">
                  <Building2Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <UnitCell organizations={flag.organizations as Organization[]} />
                  </span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Detection Date</h4>
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {flag.detectionDate && new Date(flag.detectionDate).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Last Activity</h4>
                <div className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4 text-muted-foreground" />
                  {flag.lastActivity && (
                    <>
                      {isActivityStale(flag.lastActivity) ? (
                        <Badge variant="destructive">
                          {' '}
                          {new Date(flag.lastActivity).toLocaleString()}
                        </Badge>
                      ) : (
                        <span className="text-sm">
                          {new Date(flag.lastActivity).toLocaleString()}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Flag Source</h4>
                <Badge variant="outline">{flagSourceLabels[flag.source as FlagSourceEnum]}</Badge>
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Risk Description</h4>
              <p className="text-sm text-muted-foreground">{flag.description}</p>
            </div>
            {flag.suggestedAction && (
              <div>
                <h4 className="font-semibold mb-2">Suggested Action</h4>
                <p className="text-sm text-muted-foreground">{flag.suggestedAction}</p>
              </div>
            )}
            <Separator />
            <div className="flex gap-2">{renderActions()}</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
