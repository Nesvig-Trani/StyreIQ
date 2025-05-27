'use client'

import React from 'react'

import { SocialMediaStatusEnum, useChangeStatusSocialMedia } from '@/social-medias'

//Components
import { Button } from '@/shared/components/ui/button'

//Interfaces and types
import { SocialMedia } from '@/payload-types'

export type ActionsRowSocialMediaProps = {
  socialMedia: SocialMedia
}

export const ActionsRowSocialMedia: React.FC<ActionsRowSocialMediaProps> = ({ socialMedia }) => {
  const { isLoading, stateSocialMedia, onClickApproveAccount, onClickActivateAccount } =
    useChangeStatusSocialMedia(socialMedia)

  if (stateSocialMedia.status === SocialMediaStatusEnum.PendingApproval) {
    return (
      <Button disabled={isLoading} onClick={onClickApproveAccount}>
        Approve
      </Button>
    )
  }

  if (stateSocialMedia.status === SocialMediaStatusEnum.InTransition) {
    return (
      <Button disabled={isLoading} onClick={onClickActivateAccount}>
        Activate
      </Button>
    )
  }

  return <>-</>
}
