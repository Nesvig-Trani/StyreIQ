'use client'

import React from 'react'
import Link from 'next/link'
import { PencilIcon } from 'lucide-react'

// Hooks
import { SocialMediaStatusEnum, useChangeStatusSocialMedia } from '@/social-medias'

// Components
import { Button } from '@/shared/components/ui/button'

// Types
import type { SocialMedia, User } from '@/payload-types'
import { Switch } from '@/shared/components/ui/switch'
import { UserRolesEnum } from '@/users'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Textarea } from '@/shared'

interface ActionsRowSocialMediaProps {
  socialMedia: SocialMedia
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

  const renderActionButtons = () => {
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
      {stateSocialMedia.status === SocialMediaStatusEnum.Active ||
      stateSocialMedia.status === SocialMediaStatusEnum.Inactive ? (
        <Switch
          checked={stateSocialMedia.status === SocialMediaStatusEnum.Active}
          onCheckedChange={onChangeStatus}
          disabled={
            user?.role !== UserRolesEnum.SuperAdmin &&
            stateSocialMedia.status === SocialMediaStatusEnum.Inactive
          }
        />
      ) : null}

      <Button asChild size="icon" aria-label="Edit social media">
        <Link href={`/dashboard/social-medias/update/${socialMedia.id}`}>
          <PencilIcon className="h-4 w-4 text-white" />
        </Link>
      </Button>

      {renderActionButtons()}
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
    </div>
  )
}
