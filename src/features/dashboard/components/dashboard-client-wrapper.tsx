'use client'

import { useState } from 'react'
import { RiskCategoryCard } from '@/features/dashboard/components/risk-category-card'
import { RiskDetailsModal } from '@/features/dashboard/components/risk-details-modal'
import { Shield, ShieldAlert, ClipboardList, Eye, AlertCircle, LucideIcon } from 'lucide-react'

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
    security: number
    compliance: number
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

  // TODO: Replace all this data with real data
  const issuesData: Record<string, Issue[]> = {
    'Access Management': [
      {
        id: '1',
        title: 'No Backup Admin Assigned',
        description:
          'Esta cuenta no tiene un administrador de respaldo designado para casos de emergencia',
        severity: 'high',
        dueDate: '2025-08-30',
        assignedTo: 'Usuario Desconocido',
      },
      {
        id: '2',
        title: 'Delegated Permissions Mismatch',
        description: 'Los permisos delegados no coinciden con los roles asignados en el sistema',
        severity: 'medium',
        dueDate: '2025-09-05',
        assignedTo: 'Admin Team',
      },
    ],
    'Credential Security': [
      {
        id: '3',
        title: '2FA Not Enabled',
        description: 'Usuario no ha habilitado autenticación de dos factores en su cuenta',
        severity: 'high',
        dueDate: '2025-08-26',
        assignedTo: 'Usuario Desconocido',
      },
      {
        id: '4',
        title: 'Password Not Updated',
        description: 'La contraseña del usuario no ha sido actualizada en más de 90 días',
        severity: 'medium',
        dueDate: '2025-12-01',
        assignedTo: 'Usuario Desconocido',
      },
      {
        id: '5',
        title: 'Account Password Outdated',
        description:
          'Contraseña de la cuenta "UNC Colegio de Humanidades" no ha sido actualizada en 325 días',
        severity: 'high',
        dueDate: '2025-09-09',
        affectedAccount: 'UNC Colegio de Humanidades',
      },
    ],
    'Compliance Oversight': [
      {
        id: '6',
        title: 'Policy Acknowledgment Missing',
        description:
          'Usuario no ha reconocido las últimas actualizaciones de política de redes sociales',
        severity: 'medium',
        dueDate: '2025-09-15',
        assignedTo: 'Equipo de Cumplimiento',
      },
    ],
    'Organizational Visibility': [
      {
        id: '7',
        title: 'Dormant Account Detected',
        description: 'Se ha detectado una cuenta inactiva sin administrador activo',
        severity: 'medium',
        dueDate: '2025-09-20',
        assignedTo: 'Supervisor de Unidad',
      },
      {
        id: '8',
        title: 'Unit with No Active Admins',
        description: 'La unidad no tiene administradores activos asignados',
        severity: 'high',
        dueDate: '2025-08-28',
        assignedTo: 'HR Department',
      },
    ],
    'Governance Gaps': [
      {
        id: '9',
        title: 'Third-Party Tool Connection Unclear',
        description: 'Conexión con herramienta de terceros no está claramente documentada',
        severity: 'medium',
        dueDate: '2025-09-10',
        assignedTo: 'IT Security',
      },
      {
        id: '10',
        title: 'Suspicious Third-Party Tools Detected',
        description:
          'Se han detectado herramientas de terceros no autorizadas conectadas a la cuenta',
        severity: 'high',
        dueDate: '2025-08-27',
        assignedTo: 'Security Team',
      },
    ],
  }

  const openModal = (
    title: string,
    subtitle: string,
    icon: LucideIcon,
    color: 'red' | 'yellow' | 'orange' | 'gray',
  ) => {
    const issues = issuesData[title] || []
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
          issues={9}
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
          issues={flags.security}
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
          issues={flags.compliance}
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
          issues={8}
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
          issues={2}
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
        totalIssues={modalState.totalIssues}
        icon={modalState.icon}
        color={modalState.color}
      />
    </>
  )
}
