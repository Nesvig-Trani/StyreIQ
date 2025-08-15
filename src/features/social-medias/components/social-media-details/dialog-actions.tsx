import React from 'react'
import Link from 'next/link'
import { Button } from '@/shared/components/ui/button'
import { Separator } from '@/shared'
import type { SocialMedia } from '@/types/payload-types'

interface DialogActionsProps {
  socialMedia: SocialMedia
  onClose: () => void
}

export const DialogActions: React.FC<DialogActionsProps> = ({ socialMedia, onClose }) => {
  return (
    <>
      <Separator />
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button variant="default" className="!text-white" asChild>
          <Link href={`/dashboard/social-media-accounts/update/${socialMedia.id}`}>
            Edit Account
          </Link>
        </Button>
      </div>
    </>
  )
}
