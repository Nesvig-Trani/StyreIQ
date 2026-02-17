'use client'

import React, { useMemo } from 'react'
import { CircleCheck, User as UserIcon, Key, GraduationCap, AlertTriangle } from 'lucide-react'
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
  UserStatusEnum,
} from '@/features/users'
import type { User, ComplianceTask } from '@/types/payload-types'
import { normalizeRoles } from '@/shared/utils/role-hierarchy'
import { TaskStatusIcon } from './task-status-icon'

interface UserDetailsDialogProps {
  user: User
  trigger: React.ReactNode
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  userComplianceTasks: Map<number, ComplianceTask[]>
}

export const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({
  user,
  trigger,
  isOpen,
  onOpenChange,
  userComplianceTasks,
}) => {
  const status = user.status as UserStatusEnum
  const color = statusColorMap[status] ?? 'yellow'

  const { trainingTasks, securityTasks, policyTask, rollCallTask } = useMemo(() => {
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

  const userRoles = normalizeRoles(user.roles)

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
            {userRoles.map((role) => (
              <Badge key={role} variant="secondary">
                {roleLabelMap[role]}
              </Badge>
            ))}
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
                <InfoField
                  label="All Roles"
                  value={
                    <div className="flex flex-wrap gap-1">
                      {userRoles.map((role) => (
                        <span
                          key={role}
                          className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          {roleLabelMap[role]}
                        </span>
                      ))}
                    </div>
                  }
                />
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
                  value={<TaskStatusIcon task={securityTasks.twoFA} />}
                />
                <InfoField
                  label="User Password Confirmation"
                  value={<TaskStatusIcon task={securityTasks.userPassword} />}
                />
                {securityTasks.sharedPassword && (
                  <InfoField
                    label="Shared Password Confirmation"
                    value={<TaskStatusIcon task={securityTasks.sharedPassword} />}
                  />
                )}
              </div>
              <div className="space-y-4">
                <InfoField
                  label="Policy Acknowledgment"
                  value={<TaskStatusIcon task={policyTask} />}
                />
                <InfoField
                  label="Roll Call Confirmation"
                  value={<TaskStatusIcon task={rollCallTask} />}
                />
              </div>
            </div>
          </InfoCard>

          <InfoCard
            icon={<GraduationCap className="h-4 w-4 text-black" />}
            title="Training & Compliance"
          >
            {trainingTasks.length > 0 ? (
              <div className="space-y-3">
                {trainingTasks.map((task) => (
                  <InfoField
                    key={task.id}
                    label={task.description || 'Training Task'}
                    value={<TaskStatusIcon task={task} />}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No training assigned.</p>
            )}
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
