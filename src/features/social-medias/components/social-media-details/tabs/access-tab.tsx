import React from 'react'
import type { SocialMedia, User } from '@/types/payload-types'
import { InfoCard } from '@/shared/components/ui/info-card'
interface AccessTabProps {
  socialMedia: SocialMedia
}
interface AccessItemProps {
  name: string | null
  roleLabel: string
  roleBadge: string
  badgeClasses: string
  email?: string
}
const AccessItem: React.FC<AccessItemProps> = ({
  name,
  roleLabel,
  roleBadge,
  badgeClasses,
  email,
}) => (
  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
    <div>
      <div className="text-sm font-medium text-gray-900">{name || 'Not assigned'}</div>
      <div className="text-xs text-gray-500">{roleLabel}</div>
      {email && <div className="text-xs text-gray-600">{email}</div>}
    </div>
    <span className={`px-3 py-1 text-xs font-medium rounded-full ${badgeClasses}`}>
      {roleBadge}
    </span>
  </div>
)

export const AccessTab: React.FC<AccessTabProps> = ({ socialMedia }) => {
  const getName = (user: User | number) =>
    typeof user === 'object' && user !== null && 'name' in user ? user.name : null
  const getEmail = (user: User | number) =>
    typeof user === 'object' && user !== null && 'email' in user ? user.email : undefined
  return (
    <div className="space-y-6">
      <InfoCard title="User Access Management" className="!p-6">
        <div className="mb-4">
          <h6 className="text-sm text-gray-600 m-1">All users with access to this account</h6>
        </div>
        <div className="space-y-3">
          <AccessItem
            name={getName(socialMedia.primaryAdmin)}
            roleLabel="Primary Unit Admin"
            roleBadge="Admin"
            badgeClasses="bg-green-100 text-green-700"
          />
          <AccessItem
            name={socialMedia.backupAdmin ? getName(socialMedia.backupAdmin) : 'Not assigned'}
            roleLabel="Backup Unit Admin"
            roleBadge="Admin"
            badgeClasses="bg-blue-100 text-blue-700"
          />
          {socialMedia.socialMediaManagers?.map((manager, index) => (
            <AccessItem
              key={typeof manager === 'object' && manager ? manager.id : index}
              name={getName(manager)}
              email={getEmail(manager)}
              roleLabel="Social Media Manager"
              roleBadge="SMM"
              badgeClasses="bg-gray-100 text-gray-700"
            />
          ))}
        </div>
      </InfoCard>
    </div>
  )
}
