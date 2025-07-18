import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/shared'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import { UserRolesEnum, UserStatusEnum } from '@/users'
import {
  BadgeCheckIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  MailIcon,
  ShieldIcon,
  UserIcon,
  XCircleIcon,
} from 'lucide-react'
import { User } from '@/payload-types'

const getRoleLabel = (role: UserRolesEnum) => {
  switch (role) {
    case UserRolesEnum.SuperAdmin:
      return 'Super Admin'
    case UserRolesEnum.UnitAdmin:
      return 'Unit Admin'
    case UserRolesEnum.SocialMediaManager:
      return 'Social Media Manager'
    default:
      return role
  }
}

const getStatusLabel = (status: UserStatusEnum) => {
  switch (status) {
    case UserStatusEnum.Active:
      return 'Active'
    case UserStatusEnum.Inactive:
      return 'Inactive'
    case UserStatusEnum.Rejected:
      return 'Rejected'
    case UserStatusEnum.PendingActivation:
      return 'Pending Activation'
    default:
      return status
  }
}

const getStatusColor = (status: UserStatusEnum) => {
  switch (status) {
    case UserStatusEnum.Active:
      return 'bg-green-100 text-green-800 border-green-200'
    case UserStatusEnum.Inactive:
      return 'bg-gray-100 text-gray-800 border-gray-200'
    case UserStatusEnum.Rejected:
      return 'bg-red-100 text-red-800 border-red-200'
    case UserStatusEnum.PendingActivation:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getRoleColor = (role: UserRolesEnum) => {
  switch (role) {
    case UserRolesEnum.SuperAdmin:
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case UserRolesEnum.UnitAdmin:
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case UserRolesEnum.SocialMediaManager:
      return 'bg-orange-100 text-orange-800 border-orange-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Not set'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function ViewUser({ user }: { user: User }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <EyeIcon className="h-4 w-4 mr-2" />
          View Account
        </Button>
      </DialogTrigger>
      <DialogContent className="!max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div>
              <div className="text-lg font-semibold">{user.name}</div>
              <div className="text-sm text-muted-foreground font-normal">{user.email}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Badge className={getStatusColor(user.status as UserStatusEnum)}>
              {user.status === UserStatusEnum.Active && (
                <CheckCircleIcon className="w-3 h-3 mr-1" />
              )}
              {user.status === UserStatusEnum.Inactive && <XCircleIcon className="w-3 h-3 mr-1" />}
              {user.status === UserStatusEnum.Rejected && <XCircleIcon className="w-3 h-3 mr-1" />}
              {user.status === UserStatusEnum.PendingActivation && (
                <ClockIcon className="w-3 h-3 mr-1" />
              )}
              {getStatusLabel(user.status as UserStatusEnum)}
            </Badge>
            <Badge className={getRoleColor(user.role as UserRolesEnum)}>
              <ShieldIcon className="w-3 h-3 mr-1" />
              {getRoleLabel(user.role as UserRolesEnum)}
            </Badge>
          </div>

          <div>
            <h4 className="text-base flex items-center gap-2 mb-2">
              <UserIcon className="w-4 h-4" />
              Basic Information
            </h4>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="text-sm !my-1">{user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                  <p className="text-sm !my-1 flex items-center gap-1">
                    <MailIcon className="w-3 h-3" />
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-base flex items-center gap-2 mb-2">
              <CalendarDaysIcon className="w-4 h-4" />
              Policy & Training
            </h4>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Admin Policy Agreement
                </label>
                {user.admin_policy_agreement ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <BadgeCheckIcon className="w-3 h-3 mr-1" />
                    Agreed
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    <XCircleIcon className="w-3 h-3 mr-1" />
                    Not Agreed
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Policy Review
                  </label>
                  {user.date_of_last_policy_review ? (
                    <p className="text-sm !mt-1">{formatDate(user.date_of_last_policy_review)}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {user.status === UserStatusEnum.Rejected && user.reject_reason && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-base text-red-800 flex items-center gap-2">
                  <XCircleIcon className="w-4 h-4" />
                  Rejection Reason
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-700 bg-red-50 p-3 rounded-md">
                  {user.reject_reason}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">Created:</span> {formatDate(user.createdAt)}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span> {formatDate(user.updatedAt)}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
