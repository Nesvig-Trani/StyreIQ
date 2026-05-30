'use client'

import React, { useId, useState } from 'react'
import Link from 'next/link'
import { EyeIcon, PencilIcon } from 'lucide-react'
import { SocialMediaStatusEnum, useChangeStatusSocialMedia } from '@/features/social-medias'
import { Button } from '@/shared/components/ui/button'
import { Switch } from '@/shared/components/ui/switch'
import { UserRolesEnum } from '@/features/users'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Textarea } from '@/shared'
import { Label } from '@/shared/components/ui/label'
import type { AuditLog, SocialMedia, User } from '@/types/payload-types'
import { SocialMediaDetailsDialog } from '../social-media-details'
import { getEffectiveRoleFromUser } from '@/shared/utils/role-hierarchy'

interface SocialMediaWithLogs extends SocialMedia {
  auditLogs?: {
    docs: AuditLog[]
  }
}

interface ActionsRowSocialMediaProps {
  socialMedia: SocialMediaWithLogs
  user: User | null
}

export const ActionsRowSocialMedia: React.FC<ActionsRowSocialMediaProps> = ({
  socialMedia,
  user,
}) => {
  const {
    isLoading,
    stateSocialMedia,
    onClickApproveAccount,
    onClickActivateAccount,
    onChangeStatus,
    deactivationReason,
    handleReasonChange,
    handleDeactivateConfirm,
    handleDeactivateCancel,
    showDeactivateModal,
    setShowDeactivateModal,
  } = useChangeStatusSocialMedia(socialMedia)

  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const deactivationReasonId = useId()
  const effectiveRole = getEffectiveRoleFromUser(user)
  const isSuperAdmin = effectiveRole === UserRolesEnum.SuperAdmin
  const isCentralAdmin = effectiveRole === UserRolesEnum.CentralAdmin
  const isUnitAdmin = effectiveRole === UserRolesEnum.UnitAdmin
  const isSocialMediaManager = effectiveRole === UserRolesEnum.SocialMediaManager

  const canViewDetails = isSuperAdmin || isCentralAdmin || isUnitAdmin || isSocialMediaManager
  const canEdit = isSuperAdmin || isCentralAdmin || isUnitAdmin
  const canApproveActivate = isSuperAdmin || isCentralAdmin || isUnitAdmin
  const canToggleStatus = isSuperAdmin

  const accountLabel =
    stateSocialMedia.name?.trim() || `Social media account ${stateSocialMedia.id}`
  const isAccountActive = stateSocialMedia.status === SocialMediaStatusEnum.Active
  const statusToggleLabel = `${accountLabel}: ${isAccountActive ? 'Active' : 'Inactive'}. Toggle to change account status.`

  const renderActionButtons = () => {
    if (!canApproveActivate) return null

    switch (stateSocialMedia.status) {
      case SocialMediaStatusEnum.PendingApproval:
        return (
          <Button disabled={isLoading} onClick={onClickApproveAccount}>
            Approve
          </Button>
        )
      case SocialMediaStatusEnum.InTransition:
        return (
          <Button disabled={isLoading} onClick={onClickActivateAccount}>
            Activate
          </Button>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex gap-4 items-center">
      {canToggleStatus &&
        (stateSocialMedia.status === SocialMediaStatusEnum.Active ||
          stateSocialMedia.status === SocialMediaStatusEnum.Inactive) && (
          <Switch
            checked={stateSocialMedia.status === SocialMediaStatusEnum.Active}
            onCheckedChange={onChangeStatus}
            disabled={!isSuperAdmin && stateSocialMedia.status === SocialMediaStatusEnum.Inactive}
            aria-label={statusToggleLabel}
          />
        )}

      {canViewDetails && (
        <SocialMediaDetailsDialog
          socialMedia={socialMedia}
          canEdit={canEdit}
          isOpen={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          trigger={
            <Button size="icon" aria-label={`View social media details — ${accountLabel}`}>
              <EyeIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
          }
        />
      )}

      {canEdit && (
        <Button
          className="!text-white"
          asChild
          size="icon"
          aria-label={`Edit social media — ${accountLabel}`}
        >
          <Link href={`/dashboard/social-media-accounts/update/${socialMedia.id}`}>
            <PencilIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      )}

      {renderActionButtons()}

      {canToggleStatus && (
        <Dialog open={showDeactivateModal} onOpenChange={setShowDeactivateModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>You&#39;re about to deactivate this social media account</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              If you deactivate this social media account, only the super admin can reactivate it,
              please provide a reason for deactivation
            </DialogDescription>
            <div className="grid gap-2">
              <Label htmlFor={deactivationReasonId}>Reason for deactivation</Label>
              <Textarea
                id={deactivationReasonId}
                value={deactivationReason}
                onChange={handleReasonChange}
                placeholder="Please provide a reason..."
              />
            </div>

            <DialogFooter>
              <Button variant="secondary" onClick={handleDeactivateCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleDeactivateConfirm}
                disabled={deactivationReason.trim().length <= 10}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
