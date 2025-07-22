import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Separator } from '@/shared'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import { UserRolesEnum, UserStatusEnum } from '@/users'
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  FileCheckIcon,
  GraduationCapIcon,
  LockIcon,
  ShieldIcon,
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

const formatTrainingStatus = (completed: boolean) => {
  return completed ? 'Completed' : 'Pending'
}

const getTrainingStatusColor = (completed: boolean) => {
  return completed ? 'text-green-600' : 'text-orange-600'
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

          <Separator />

          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <LockIcon className="h-4 w-4" />
              Security & Compliance
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium mb-1">Two-Factor Authentication</h5>
                <div className="flex items-center gap-1">
                  <ShieldIcon
                    className={`h-4 w-4 ${user.isEnabledTwoFactor ? 'text-green-600' : 'text-red-600'}`}
                  />
                  <span
                    className={`text-sm ${user.isEnabledTwoFactor ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {user.isEnabledTwoFactor ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
              <div>
                <h5 className="font-medium mb-1">Secure Password</h5>
                <div className="flex items-center gap-1">
                  <LockIcon
                    className={`h-4 w-4 ${user.isInUseSecurePassword ? 'text-green-600' : 'text-red-600'}`}
                  />
                  <span
                    className={`text-sm ${user.isInUseSecurePassword ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {user.isInUseSecurePassword ? 'Secure' : 'Needs Update'}
                  </span>
                </div>
              </div>
              <div>
                <h5 className="font-medium mb-1">Password Last Updated</h5>
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {user.passwordUpdatedAt ? formatDate(user.passwordUpdatedAt) : 'Never'}
                  </span>
                </div>
              </div>
              <div>
                <h5 className="font-medium mb-1">Policies Accepted</h5>
                <div className="flex items-center gap-1">
                  <FileCheckIcon
                    className={`h-4 w-4 ${user.admin_policy_agreement ? 'text-green-600' : 'text-red-600'}`}
                  />
                  <span
                    className={`text-sm ${user.admin_policy_agreement ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {user.admin_policy_agreement ? 'Accepted' : 'Not Accepted'}
                  </span>
                </div>
              </div>
              <div>
                <h5 className="font-medium mb-1">Last Policy Review</h5>
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className={`text-sm `}>
                    {user.date_of_last_policy_review ? (
                      <span className="text-sm !mt-1">
                        {formatDate(user.date_of_last_policy_review)}
                      </span>
                    ) : null}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <GraduationCapIcon className="h-4 w-4" />
              Training Status
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium mb-1">Accessibility Training</h5>
                <span
                  className={`text-sm ${getTrainingStatusColor(user.isCompletedTrainingAccessibility || false)}`}
                >
                  {formatTrainingStatus(user.isCompletedTrainingAccessibility || false)}
                </span>
              </div>
              <div>
                <h5 className="font-medium mb-1">Risk Training</h5>
                <span
                  className={`text-sm ${getTrainingStatusColor(user.isCompletedTrainingRisk || false)}`}
                >
                  {formatTrainingStatus(user.isCompletedTrainingRisk || false)}
                </span>
              </div>
              <div>
                <h5 className="font-medium mb-1">Brand Training</h5>
                <span
                  className={`text-sm ${getTrainingStatusColor(user.isCompletedTrainingBrand || false)}`}
                >
                  {formatTrainingStatus(user.isCompletedTrainingBrand || false)}
                </span>
              </div>
              <div>
                <h5 className="font-medium mb-1">Knowledge Standards</h5>
                <span
                  className={`text-sm ${getTrainingStatusColor(user.hasKnowledgeStandards || false)}`}
                >
                  {user.hasKnowledgeStandards ? 'Met' : 'Not Met'}
                </span>
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
