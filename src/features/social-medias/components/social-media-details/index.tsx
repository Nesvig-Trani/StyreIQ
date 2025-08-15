'use client'

import React, { useState } from 'react'
import { CircleCheck } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import { Badge } from '@/shared'

import {
  platformLabelMap,
  statusClassMap,
  statusColorMap,
  statusLabelMap,
  PlatformEnum,
  SocialMediaStatusEnum,
} from '@/features/social-medias'
import type { AuditLog, SocialMedia } from '@/types/payload-types'
import { TabNavigation } from './tab-navigation'
import { TabContent } from './tab-content'
import { DialogActions } from './dialog-actions'

interface SocialMediaWithLogs extends SocialMedia {
  auditLogs?: {
    docs: AuditLog[]
  }
}

interface SocialMediaDetailsDialogProps {
  socialMedia: SocialMediaWithLogs
  trigger: React.ReactNode
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export enum TabType {
  OVERVIEW = 'overview',
  SECURITY = 'security',
  ACCESS = 'access',
  AUDIT = 'audit',
}

export const SocialMediaDetailsDialog: React.FC<SocialMediaDetailsDialogProps> = ({
  socialMedia,
  trigger,
  isOpen,
  onOpenChange,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.OVERVIEW)

  const platform = socialMedia.platform as PlatformEnum
  const status = socialMedia.status as SocialMediaStatusEnum
  const color = statusColorMap[status] ?? 'yellow'

  const tabs = [
    { id: TabType.OVERVIEW, label: 'Overview', active: activeTab === TabType.OVERVIEW },
    { id: TabType.SECURITY, label: 'Security', active: activeTab === TabType.SECURITY },
    { id: TabType.ACCESS, label: 'Access & Users', active: activeTab === TabType.ACCESS },
    { id: TabType.AUDIT, label: 'Audit Log', active: activeTab === TabType.AUDIT },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="!max-w-4xl max-h-[90vh] w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {socialMedia.name || 'UNC College of Humanities'}
            <CircleCheck />
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{platformLabelMap[platform]}</Badge>
            <Badge className={`${statusClassMap[color]} capitalize`}>
              {statusLabelMap[status]}
            </Badge>
          </div>
        </DialogHeader>

        <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <TabContent activeTab={activeTab} socialMedia={socialMedia} />

        <DialogActions socialMedia={socialMedia} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
