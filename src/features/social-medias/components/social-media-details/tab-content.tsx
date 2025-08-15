import React from 'react'

import type { AuditLog, SocialMedia } from '@/types/payload-types'
import { TabType } from '.'
import { OverviewTab } from './tabs/overview-tab'
import { SecurityTab } from './tabs/security-tab'
import { AccessTab } from './tabs/access-tab'
import { AuditTab } from './tabs/audit-tab'
interface SocialMediaWithLogs extends SocialMedia {
  auditLogs?: {
    docs: AuditLog[]
  }
}

interface TabContentProps {
  activeTab: TabType
  socialMedia: SocialMediaWithLogs
}

export const TabContent: React.FC<TabContentProps> = ({ activeTab, socialMedia }) => {
  switch (activeTab) {
    case TabType.OVERVIEW:
      return <OverviewTab socialMedia={socialMedia} />
    case TabType.SECURITY:
      return <SecurityTab socialMedia={socialMedia} />
    case TabType.ACCESS:
      return <AccessTab socialMedia={socialMedia} />
    case TabType.AUDIT:
      return <AuditTab socialMedia={socialMedia} />
    default:
      return null
  }
}
