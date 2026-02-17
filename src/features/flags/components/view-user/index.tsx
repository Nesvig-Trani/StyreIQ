'use client'

import { useMemo } from 'react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Separator } from '@/shared'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import { UserRolesEnum, UserStatusEnum } from '@/features/users'
import {
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  GraduationCapIcon,
  LockIcon,
  ShieldIcon,
  XCircleIcon,
} from 'lucide-react'
import { User, ComplianceTask } from '@/types/payload-types'
import { normalizeRoles } from '@/shared/utils/role-hierarchy'
import { getTaskStatus } from '@/features/users/components/details/task-status-icon'

const getRoleLabel = (role: UserRolesEnum) => {
  switch (role) {
    case UserRolesEnum.SuperAdmin:
      return 'Super Admin'
    case UserRolesEnum.CentralAdmin:
      return 'Central Admin'
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
    case UserRolesEnum.CentralAdmin:
      return 'bg-indigo-100 text-indigo-800 border-indigo-200'
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

interface ViewUserProps {
  user: User
  userComplianceTasks: Map<number, ComplianceTask[]>
}

export function ViewUser({ user, userComplianceTasks }: ViewUserProps) {
  const userRoles = normalizeRoles(user.roles)
  const activeRole = user.active_role as UserRolesEnum | undefined

  const { trainingTasks, securityTasks, policyTask, rollCallTask } = useMemo(() => {
    if (!userComplianceTasks) {
      return {
        trainingTasks: [],
        securityTasks: {
          twoFA: undefined,
          userPassword: undefined,
          sharedPassword: undefined,
        },
        policyTask: undefined,
        rollCallTask: undefined,
      }
    }

    const userTasks = userComplianceTasks.get(user.id) || []

    return {
      trainingTasks: userTasks.filter((task) => task.type === 'TRAINING_COMPLETION'),
      securityTasks: {
        twoFA: userTasks.find((task) => task.type === 'CONFIRM_2FA'),
        userPassword: userTasks.find((task) => task.type === 'CONFIRM_USER_PASSWORD'),
        sharedPassword: userTasks.find((task) => task.type === 'CONFIRM_SHARED_PASSWORD'),
      },
      policyTask: userTasks.find((task) => task.type === 'POLICY_ACKNOWLEDGMENT'),
      rollCallTask: userTasks.find((task) => task.type === 'USER_ROLL_CALL'),
    }
  }, [user.id, userComplianceTasks])

  const twoFAStatus = getTaskStatus(securityTasks.twoFA)
  const userPasswordStatus = getTaskStatus(securityTasks.userPassword)
  const policyStatus = getTaskStatus(policyTask)
  const rollCallStatus = getTaskStatus(rollCallTask)

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
            {userRoles.map((role) => (
              <Badge key={role} className={getRoleColor(role)}>
                <ShieldIcon className="w-3 h-3 mr-1" />
                {getRoleLabel(role)}
                {activeRole === role && <span className="ml-1 text-xs">(Active)</span>}
              </Badge>
            ))}
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
                  <twoFAStatus.icon className={`h-4 w-4 ${twoFAStatus.color}`} />
                  <span className={`text-sm ${twoFAStatus.color}`}>{twoFAStatus.label}</span>
                </div>
              </div>
              <div>
                <h5 className="font-medium mb-1">User Password Confirmation</h5>
                <div className="flex items-center gap-1">
                  <userPasswordStatus.icon className={`h-4 w-4 ${userPasswordStatus.color}`} />
                  <span className={`text-sm ${userPasswordStatus.color}`}>
                    {userPasswordStatus.label}
                  </span>
                </div>
              </div>
              {securityTasks.sharedPassword && user.roles.includes('social_media_manager') && (
                <div>
                  <h5 className="font-medium mb-1">Shared Password Confirmation</h5>
                  <div className="flex items-center gap-1">
                    {(() => {
                      const status = getTaskStatus(securityTasks.sharedPassword)
                      return (
                        <>
                          <status.icon className={`h-4 w-4 ${status.color}`} />
                          <span className={`text-sm ${status.color}`}>{status.label}</span>
                        </>
                      )
                    })()}
                  </div>
                </div>
              )}

              <div>
                <h5 className="font-medium mb-1">Policy Acknowledgment</h5>
                <div className="flex items-center gap-1">
                  <policyStatus.icon className={`h-4 w-4 ${policyStatus.color}`} />
                  <span className={`text-sm ${policyStatus.color}`}>{policyStatus.label}</span>
                </div>
              </div>
              <div>
                <h5 className="font-medium mb-1">Roll Call Confirmation</h5>
                <div className="flex items-center gap-1">
                  <rollCallStatus.icon className={`h-4 w-4 ${rollCallStatus.color}`} />
                  <span className={`text-sm ${rollCallStatus.color}`}>{rollCallStatus.label}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <GraduationCapIcon className="h-4 w-4" />
              Training & Compliance
            </h4>
            {trainingTasks.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {trainingTasks.map((task) => {
                  const status = getTaskStatus(task)
                  return (
                    <div key={task.id}>
                      <h5 className="font-medium mb-1">{task.description || 'Training Task'}</h5>
                      <div className="flex items-center gap-1">
                        <status.icon className={`h-4 w-4 ${status.color}`} />
                        <span className={`text-sm ${status.color}`}>{status.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No training assigned.</p>
            )}
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
