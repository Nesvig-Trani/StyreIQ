'use client'

import { useState } from 'react'
import { RiskCategoryCard } from '@/features/dashboard/components/risk-category-card'
import { RiskDetailsModal } from '@/features/dashboard/components/risk-details-modal'
import { Shield, ShieldAlert, ClipboardList, LucideIcon, Flag as FlagIcon } from 'lucide-react'
import { flagTypeLabels } from '@/features/flags/constants/flagTypeLabels'
import { ComplianceTask, Flag } from '@/types/payload-types'
import { FlagTypeEnum } from '@/features/flags/schemas'
import { getUsersByIds } from '@/features/users'

interface IssueUser {
  id: number
  name: string
  email: string
}

interface Issue {
  id: string
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
  dueDate: string
  assignedTo?: string
  affectedAccount?: string
  user?: IssueUser
}

interface DashboardRiskSectionProps {
  flags: {
    accessManagement: { count: number; data: (Flag | ComplianceTask)[] }
    security: { count: number; data: (Flag | ComplianceTask)[] }
    policiesTraining: { count: number; data: (Flag | ComplianceTask)[] }
    flaggedIssues: { count: number; data: (Flag | ComplianceTask)[] }
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

  const convertFlagsToIssues = async (data: (Flag | ComplianceTask)[]): Promise<Issue[]> => {
    const isFlag = (item: Flag | ComplianceTask): item is Flag => {
      return 'flagType' in item
    }

    const flagsOnly = data.filter(isFlag)

    const userIds = flagsOnly
      .map((flag) =>
        flag.affectedEntity?.relationTo === 'users' && flag.affectedEntity.value
          ? Number(flag.affectedEntity.value)
          : null,
      )
      .filter((id): id is number => id !== null)

    const uniqueUserIds = [...new Set(userIds)]

    const usersMap = new Map<number, { id: number; name?: string; email?: string }>()

    if (uniqueUserIds.length > 0) {
      const users = await getUsersByIds({ ids: uniqueUserIds })
      users.forEach((user) => usersMap.set(user.id, user))
    }

    const flagIssues: Issue[] = flagsOnly.map((flag) => {
      const userData =
        flag.affectedEntity?.relationTo === 'users'
          ? usersMap.get(Number(flag.affectedEntity.value))
          : undefined

      return {
        id: flag.id.toString(),
        title: flagTypeLabels[flag.flagType as FlagTypeEnum],
        description: flag.description ?? '',
        severity: getFlagSeverity(flag.flagType as string),
        dueDate: flag.createdAt,
        user: userData
          ? {
              id: userData.id,
              name: userData.name || 'Usuario sin nombre',
              email: userData.email || 'Email no disponible',
            }
          : undefined,
      }
    })

    return flagIssues
  }

  const getFlagSeverity = (flagType: string): 'high' | 'medium' | 'low' => {
    const highSeverity = [
      'missing_2fa',
      'no_assigned_owner',
      'inactive_account',
      'incomplete_training',
      'unacknowledged_policies',
      'incomplete_offboarding',
      'incident_open',
      'security_risk',
      'legal_not_confirmed',
    ]

    const mediumSeverity = ['outdated_password']

    if (highSeverity.includes(flagType)) return 'high'
    if (mediumSeverity.includes(flagType)) return 'medium'
    return 'low'
  }

  const getCategoryData = (categoryName: string) => {
    switch (categoryName) {
      case 'Access Management':
        return flags.accessManagement.data
      case 'Security Requirements':
        return flags.security.data
      case 'Policies & Training':
        return flags.policiesTraining.data
      case 'Flagged Issues':
        return flags.flaggedIssues.data
      default:
        return []
    }
  }

  const openModal = async (
    title: string,
    subtitle: string,
    icon: LucideIcon,
    color: 'red' | 'yellow' | 'orange' | 'gray',
  ) => {
    const realData = getCategoryData(title)
    const issues = await convertFlagsToIssues(realData)

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
          subtitle="Review and confirm access to assigned social media accounts"
          issues={flags.accessManagement.count}
          color="red"
          icon={Shield}
          items={[]}
          onClick={() =>
            openModal(
              'Access Management',
              'Review and confirm access to assigned social media accounts',
              Shield,
              'red',
            )
          }
        />

        <RiskCategoryCard
          title="Security Requirements"
          subtitle="Confirm required security practices for users and accounts"
          issues={flags.security.count}
          color="red"
          icon={ShieldAlert}
          items={[]}
          onClick={() =>
            openModal(
              'Security Requirements',
              'Confirm required security practices for users and accounts',
              ShieldAlert,
              'red',
            )
          }
        />

        <RiskCategoryCard
          title="Policies & Training"
          subtitle="Acknowledge required policies and complete required training"
          issues={flags.policiesTraining.count}
          color="yellow"
          icon={ClipboardList}
          items={[]}
          onClick={() =>
            openModal(
              'Policies & Training',
              'Acknowledge required policies and complete required training',
              ClipboardList,
              'yellow',
            )
          }
        />

        <RiskCategoryCard
          title="Flagged Issues"
          subtitle="Resolve manually flagged issues"
          issues={flags.flaggedIssues.count}
          color="red"
          icon={FlagIcon}
          items={[]}
          onClick={() =>
            openModal('Flagged Issues', 'Resolve manually flagged issues', FlagIcon, 'red')
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
