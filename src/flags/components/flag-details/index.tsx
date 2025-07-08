import { flagSourceLabels } from '@/flags/constants/flagSourceLabels'
import { FlagSourceEnum, FlagStatusEnum } from '@/flags/schemas'
import { getStatusColor, isActivityStale } from '@/flags/utils'
import { Flag } from '@/payload-types'
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
  ExternalLinkIcon,
  EyeIcon,
} from 'lucide-react'

export function FlagDetails({ flag }: { flag: Flag }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <EyeIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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
                    {flag && typeof flag.organization === 'object' && flag.organization?.name}
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
            <div>
              <h4 className="font-semibold mb-3">Account Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium mb-1">Account Name</h5>
                  <p className="text-sm">
                    {flag &&
                      typeof flag.affectedEntity?.value === 'object' &&
                      flag.affectedEntity.value.name}
                  </p>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Account URL</h5>
                  {flag &&
                    typeof flag.affectedEntity?.value === 'object' &&
                    flag.affectedEntity.relationTo === 'social-medias' &&
                    flag.affectedEntity.value.profileUrl && (
                      <a
                        href={flag.affectedEntity.value.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 underline inline-flex items-center gap-1"
                      >
                        {flag.affectedEntity.value.profileUrl}
                        <ExternalLinkIcon className="h-3 w-3" />
                      </a>
                    )}
                </div>
                <div>
                  <h5 className="font-medium mb-1">Account Status</h5>
                  <Badge>
                    {flag &&
                      flag.affectedEntity &&
                      typeof flag.affectedEntity.value === 'object' &&
                      flag.affectedEntity.value.status}
                  </Badge>
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex gap-2">
              <Button variant="outline">
                <EyeIcon className="h-4 w-4 mr-2" />
                View Account
              </Button>
              <Button variant="outline">
                <EditIcon className="h-4 w-4 mr-2" />
                Edit Account
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
