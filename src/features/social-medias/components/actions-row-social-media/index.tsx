'use client'

import React, { useState } from 'react'
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
  const effectiveRole = getEffectiveRoleFromUser(user)
  const isSuperAdmin = effectiveRole === UserRolesEnum.SuperAdmin
  const isUnitAdmin = effectiveRole === UserRolesEnum.UnitAdmin
  const isSocialMediaManager = effectiveRole === UserRolesEnum.SocialMediaManager

  const canViewDetails = isSuperAdmin || isUnitAdmin || isSocialMediaManager
  const canEdit = isSuperAdmin || isUnitAdmin
  const canApproveActivate = isSuperAdmin || isUnitAdmin
  const canToggleStatus = isSuperAdmin

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
          />
        )}

      {canViewDetails && (
        <SocialMediaDetailsDialog
          socialMedia={socialMedia}
          canEdit={canEdit}
          isOpen={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          trigger={
            <Button size="icon" aria-label="View social media details">
              <EyeIcon className="h-4 w-4" />
            </Button>
          }
        />
      )}

      {canEdit && (
        <Button className="!text-white" asChild size="icon" aria-label="Edit social media">
          <Link href={`/dashboard/social-media-accounts/update/${socialMedia.id}`}>
            <PencilIcon className="h-4 w-4" />
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
            <Textarea
              value={deactivationReason}
              onChange={handleReasonChange}
              placeholder="Please provide a reason..."
            />

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
