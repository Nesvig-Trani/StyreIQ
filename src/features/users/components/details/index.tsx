'use client'

import React from 'react'
import {
  CircleCheck,
  User as UserIcon,
  Key,
  GraduationCap,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import { Badge } from '@/shared/components/ui/badge'
import { InfoField } from '@/shared/components/ui/info-field'
import { InfoCard } from '@/shared/components/ui/info-card'
import {
  roleLabelMap,
  statusClassMap,
  statusColorMap,
  statusLabelMap,
  UserRolesEnum,
  UserStatusEnum,
} from '@/features/users'
import type { User } from '@/types/payload-types'

interface UserDetailsDialogProps {
  user: User
  trigger: React.ReactNode
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({
  user,
  trigger,
  isOpen,
  onOpenChange,
}) => {
  const status = user.status as UserStatusEnum
  const color = statusColorMap[status] ?? 'yellow'

  const StatusIcon = ({ value }: { value?: boolean | null }) => (
    <span className="flex items-center gap-1">
      {value ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-red-600" />
      )}
      {value ? 'Yes' : 'No'}
    </span>
  )

  const TrainingStatus = ({ value }: { value?: boolean | null }) => (
    <span className="flex items-center gap-1">
      {value ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-gray-400" />
      )}
      {value ? 'Completed' : 'Incomplete'}
    </span>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="!max-w-4xl max-h-[90vh] w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {user.name}
            {user.status === 'active' && <CircleCheck className="h-4 w-4 text-green-600" />}
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{roleLabelMap[user.role as UserRolesEnum]}</Badge>
            <Badge className={`${statusClassMap[color]} capitalize`}>
              {statusLabelMap[status]}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <InfoCard icon={<UserIcon className="h-4 w-4 text-black" />} title="Basic Information">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <InfoField label="Full Name" value={user.name} />
                <InfoField label="Email" value={user.email} />
                <InfoField label="User ID" value={user.id.toString()} />
              </div>
              <div className="space-y-4">
                <InfoField label="Role" value={roleLabelMap[user.role as UserRolesEnum]} />
                <InfoField label="Status" value={statusLabelMap[user.status as UserStatusEnum]} />
                <InfoField label="Login Attempts" value={user.loginAttempts?.toString() || '0'} />
              </div>
            </div>
          </InfoCard>

          <InfoCard icon={<Key className="h-4 w-4 text-black" />} title="Security & Authentication">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <InfoField
                  label="Two-Factor Authentication"
                  value={<StatusIcon value={user.isEnabledTwoFactor} />}
                />
                <InfoField
                  label="Secure Password"
                  value={<StatusIcon value={user.isInUseSecurePassword} />}
                />
                <InfoField
                  label="Admin Policy Agreement"
                  value={<StatusIcon value={user.admin_policy_agreement} />}
                />
              </div>
              <div className="space-y-4">
                <InfoField
                  label="Password Last Updated"
                  value={
                    user.passwordUpdatedAt
                      ? new Date(user.passwordUpdatedAt).toLocaleDateString()
                      : 'Never updated'
                  }
                />
                <InfoField
                  label="Last Training Date"
                  value={
                    user.date_of_last_training
                      ? new Date(user.date_of_last_training).toLocaleDateString()
                      : 'No training recorded'
                  }
                />
                <InfoField
                  label="Last Policy Review"
                  value={
                    user.date_of_last_policy_review
                      ? new Date(user.date_of_last_policy_review).toLocaleDateString()
                      : 'No review recorded'
                  }
                />
              </div>
            </div>
          </InfoCard>

          <InfoCard
            icon={<GraduationCap className="h-4 w-4 text-black" />}
            title="Training & Compliance"
          >
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <InfoField
                  label="Knowledge Standards"
                  value={<TrainingStatus value={user.hasKnowledgeStandards} />}
                />
                <InfoField
                  label="Accessibility Training"
                  value={<TrainingStatus value={user.isCompletedTrainingAccessibility} />}
                />
              </div>
              <div className="space-y-4">
                <InfoField
                  label="Brand Training"
                  value={<TrainingStatus value={user.isCompletedTrainingBrand} />}
                />
                <InfoField
                  label="Risk Training"
                  value={<TrainingStatus value={user.isCompletedTrainingRisk} />}
                />
              </div>
            </div>
          </InfoCard>

          {user.reject_reason && (
            <InfoCard
              icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
              title="Rejection Information"
            >
              <InfoField
                label="Rejection Reason"
                value={<span className="text-red-600">{user.reject_reason}</span>}
              />
            </InfoCard>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
