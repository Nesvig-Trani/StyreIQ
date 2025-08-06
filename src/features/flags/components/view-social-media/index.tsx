import { SocialMedia } from '@/types/payload-types'
import { Badge, Button, Separator } from '@/shared'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import {
  AlertCircleIcon,
  CalendarIcon,
  ClockIcon,
  ExternalLinkIcon,
  EyeIcon,
  Globe,
  MailIcon,
  PhoneIcon,
  Shield,
} from 'lucide-react'

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

const getStatusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'default'
    case 'inactive':
    case 'rejected':
      return 'destructive'
    case 'pending activation':
    case 'pending approval':
    case 'in transition':
      return 'secondary'
    default:
      return 'outline'
  }
}

export function ViewSocialMedia({ account }: { account: SocialMedia }) {
  return (
    <Dialog>
      <DialogTrigger>
        <Button variant="outline">
          <EyeIcon className="h-4 w-4 mr-2" />
          View Account
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Social Media Account Details
          </DialogTitle>
          <DialogDescription>
            Social media account configuration and compliance status
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Basic Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium mb-1">Name</h5>
                <p className="text-sm">{account.name}</p>
              </div>
              <div>
                <h5 className="font-medium mb-1">Platform</h5>
                <p className="text-sm">{account.platform}</p>
              </div>
              <div>
                <h5 className="font-medium mb-1">Profile URL</h5>
                <a
                  href={account.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  {account.profileUrl}
                  <ExternalLinkIcon className="h-3 w-3" />
                </a>
              </div>
              <div>
                <h5 className="font-medium mb-1">Status</h5>
                <Badge variant={getStatusBadgeVariant(account.status)}>{account.status}</Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <PhoneIcon className="h-4 w-4" />
              Contact Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium mb-1">Contact Email</h5>
                <div className="flex items-center gap-1">
                  <MailIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{account.contactEmail || 'Not provided'}</span>
                </div>
              </div>
              <div>
                <h5 className="font-medium mb-1">Contact Phone</h5>
                <div className="flex items-center gap-1">
                  <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{account.contactPhone || 'Not provided'}</span>
                </div>
              </div>
            </div>
          </div>
          {account.inactiveFlag && (
            <>
              <Separator />
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircleIcon className="h-5 w-5 text-orange-600" />
                  <h4 className="font-semibold text-orange-800">Inactive Account Warning</h4>
                </div>
                <p className="text-sm text-orange-700">
                  This account has been flagged as inactive due to no public activity for 30+ days.
                </p>
                {account.deactivationReason && (
                  <p className="text-sm text-orange-700 mt-1">
                    <strong>Reason:</strong> {account.deactivationReason}
                  </p>
                )}
              </div>
            </>
          )}

          <Separator />

          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <ClockIcon className="h-4 w-4" />
              Account History
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium mb-1">Created</h5>
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {account.createdAt && formatDate(account.createdAt)}
                  </span>
                </div>
              </div>
              <div>
                <h5 className="font-medium mb-1">Last Updated</h5>
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {account.updatedAt && formatDate(account.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
