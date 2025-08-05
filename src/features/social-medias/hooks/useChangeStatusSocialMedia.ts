'use client'
import React, { useState } from 'react'
import { toast } from 'sonner'

import { changeStatusSocialMedia } from '@/sdk/social-medias'
import { EndpointError } from '@/shared'

//Interfaces and types
import { SocialMediaStatusEnum } from '@/features/social-medias'
import { SocialMedia } from '@/types/payload-types'
import { useRouter } from 'next/navigation'

export type ChangeStatusSocialMediaReturn = {
  isLoading: boolean
  stateSocialMedia: SocialMedia
  onClickApproveAccount: () => Promise<void>
  onClickActivateAccount: () => Promise<void>
  onChangeStatus: (newStatus: boolean) => Promise<void>
  showDeactivateModal: boolean
  setShowDeactivateModal: React.Dispatch<React.SetStateAction<boolean>>
  deactivationReason: string
  handleReasonChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleDeactivateConfirm: () => Promise<void>
  handleDeactivateCancel: () => void
}

export function useChangeStatusSocialMedia(
  socialMedia: SocialMedia,
): ChangeStatusSocialMediaReturn {
  const [isLoading, setIsLoading] = React.useState(false)
  const [stateSocialMedia, setStateSocialMedia] = useState<SocialMedia>({ ...socialMedia })

  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [deactivationReason, setDeactivationReason] = useState('')

  const router = useRouter()

  const onClickApproveAccount = async () => {
    if (isLoading) return

    try {
      setIsLoading(true)
      await changeStatusSocialMedia(socialMedia.id, SocialMediaStatusEnum.InTransition)
      toast.success('Status updated successfully')

      setStateSocialMedia((prev) => ({
        ...prev,
        status: SocialMediaStatusEnum.InTransition,
      }))
    } catch (error) {
      if (error instanceof EndpointError) {
        toast.error(error.message)
      } else {
        toast.error(
          'An error occurred while changing the status of the social media account, please try again',
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  const onClickActivateAccount = async () => {
    if (isLoading) return

    try {
      setIsLoading(true)
      await changeStatusSocialMedia(socialMedia.id, SocialMediaStatusEnum.Active)
      toast.success('Status updated successfully')

      setStateSocialMedia((prev) => ({
        ...prev,
        status: SocialMediaStatusEnum.Active,
      }))
    } catch (error) {
      if (error instanceof EndpointError) {
        toast.error(error.message)
      } else {
        toast.error(
          'An error occurred while changing the status of the social media account, please try again',
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  const onChangeStatus = async (newStatus: boolean) => {
    try {
      if (isLoading) return
      if (!newStatus) {
        setShowDeactivateModal(true)
        return
      }
      setIsLoading(true)
      await changeStatusSocialMedia(
        socialMedia.id,
        newStatus ? SocialMediaStatusEnum.Active : SocialMediaStatusEnum.Inactive,
      )
      toast.success('Status updated successfully')
      router.refresh()
    } catch {
      toast.error(
        'An error occurred while changing the status of the social media account, please try again',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleReasonChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const reason = event.target.value
    setDeactivationReason(reason)
  }

  const handleDeactivateCancel = () => {
    setShowDeactivateModal(false)
    setDeactivationReason('')
  }

  const handleDeactivateConfirm = async () => {
    try {
      setIsLoading(true)
      await changeStatusSocialMedia(
        socialMedia.id,
        SocialMediaStatusEnum.Inactive,
        deactivationReason,
      )
      toast.success('Status updated successfully')
      router.refresh()
      setShowDeactivateModal(false)
    } catch {
      toast.error(
        'An error occurred while changing the status of the social media account, please try again',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    stateSocialMedia,
    onClickApproveAccount,
    onClickActivateAccount,
    onChangeStatus,
    showDeactivateModal,
    handleReasonChange,
    deactivationReason,
    handleDeactivateCancel,
    handleDeactivateConfirm,
    setShowDeactivateModal,
  }
}
