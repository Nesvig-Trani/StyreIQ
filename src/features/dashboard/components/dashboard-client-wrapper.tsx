'use client'

import { useState } from 'react'
import { RiskCategoryCard } from '@/features/dashboard/components/risk-category-card'
import { RiskDetailsModal } from '@/features/dashboard/components/risk-details-modal'
import { Shield, ShieldAlert, ClipboardList, Eye, AlertCircle, LucideIcon } from 'lucide-react'
import { flagTypeLabels } from '@/features/flags/constants/flagTypeLabels'
import { Flag } from '@/types/payload-types'
import { FlagTypeEnum } from '@/features/flags/schemas'

interface Issue {
  id: string
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
  dueDate: string
  assignedTo?: string
  affectedAccount?: string
}

interface DashboardRiskSectionProps {
  flags: {
    security: {
      count: number
      data: Flag[]
    }
    compliance: {
      count: number
      data: Flag[]
    }
    activity: {
      count: number
      data: Flag[]
    }
    legal: {
      count: number
      data: Flag[]
    }
    incident: {
      count: number
      data: Flag[]
    }
  }
}

export const DashboardRiskSection: React.FC<DashboardRiskSectionProps> = ({ flags }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    subtitle: '',
    issues: [] as Issue[],
    totalIssues: 0,
    icon: Shield,
    color: 'red' as 'red' | 'yellow' | 'orange' | 'gray',
  })

  const convertFlagsToIssues = (flagsData: Flag[]): Issue[] => {
    return flagsData.map((flag) => ({
      id: flag.id.toString(),
      title: flagTypeLabels[flag.flagType as FlagTypeEnum],
      description: flag.description ?? '',
      severity: getFlagSeverity(flag.flagType as string),
      dueDate: flag.createdAt,
    }))
  }

  const getFlagSeverity = (flagType: string): 'high' | 'medium' | 'low' => {
    const highSeverity = ['security_risk', 'missing_2fa', 'incident_open', 'legal_not_confirmed']
    const mediumSeverity = [
      'outdated_password',
      'incomplete_training',
      'unacknowledged_policies',
      'inactive_account',
    ]

    if (highSeverity.includes(flagType)) return 'high'
    if (mediumSeverity.includes(flagType)) return 'medium'
    return 'low'
  }

  const getCategoryData = (categoryName: string) => {
    switch (categoryName) {
      case 'Access Management':
        return flags.incident.data
      case 'Credential Security':
        return flags.security.data
      case 'Compliance Oversight':
        return flags.compliance.data
      case 'Organizational Visibility':
        return flags.activity.data
      case 'Governance Gaps':
        return flags.legal.data
      default:
        return []
    }
  }

  const openModal = (
    title: string,
    subtitle: string,
    icon: LucideIcon,
    color: 'red' | 'yellow' | 'orange' | 'gray',
  ) => {
    const realData = getCategoryData(title)
    const issues = convertFlagsToIssues(realData)

    setModalState({
      isOpen: true,
      title,
      subtitle,
      issues,
      totalIssues: issues.length,
      icon,
      color,
    })
  }

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }))
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <RiskCategoryCard
          title="Access Management"
          subtitle="Admin assignment gaps, shared credentials"
          issues={flags.incident.count}
          color="red"
          icon={Shield}
          items={[
            'No Backup Admin Assigned',
            'Delegated Permissions Mismatch',
            'No Backup Admin Assigned',
          ]}
          onClick={() =>
            openModal(
              'Access Management',
              'Admin assignment gaps, shared credentials',
              Shield,
              'red',
            )
          }
        />

        <RiskCategoryCard
          title="Credential Security"
          subtitle="Outdated passwords, missing 2FA/MFA"
          issues={flags.security.count}
          color="red"
          icon={ShieldAlert}
          items={['2FA Not Enabled', 'Password Not Updated', 'Account Password Outdated']}
          onClick={() =>
            openModal(
              'Credential Security',
              'Outdated passwords, missing 2FA/MFA',
              ShieldAlert,
              'red',
            )
          }
        />

        <RiskCategoryCard
          title="Compliance Oversight"
          subtitle="Missing training, ignored policies"
          issues={flags.compliance.count}
          color="yellow"
          icon={ClipboardList}
          items={['Policy Acknowledgment Missing']}
          onClick={() =>
            openModal(
              'Compliance Oversight',
              'Missing training, ignored policies',
              ClipboardList,
              'yellow',
            )
          }
        />

        <RiskCategoryCard
          title="Organizational Visibility"
          subtitle="Orphaned accounts, misassigned units"
          issues={flags.activity.count}
          color="yellow"
          icon={Eye}
          items={['Dormant Account Detected', 'Unit with No Active Admins']}
          onClick={() =>
            openModal(
              'Organizational Visibility',
              'Orphaned accounts, misassigned units',
              Eye,
              'yellow',
            )
          }
        />

        <RiskCategoryCard
          title="Governance Gaps"
          subtitle="No backup contacts, tools not reviewed"
          issues={flags.legal.count}
          color="yellow"
          icon={AlertCircle}
          items={['Third-Party Tool Connection Unclear', 'Suspicious Third-Party Tools Detected']}
          onClick={() =>
            openModal(
              'Governance Gaps',
              'No backup contacts, tools not reviewed',
              AlertCircle,
              'yellow',
            )
          }
        />
      </div>

      <RiskDetailsModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        subtitle={modalState.subtitle}
        issues={modalState.issues}
        icon={modalState.icon}
        color={modalState.color}
      />
    </>
  )
}
