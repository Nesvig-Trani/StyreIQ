import React from 'react'
import { ShieldIcon, CircleCheck } from 'lucide-react'

import type { SocialMedia } from '@/types/payload-types'
import { InfoCard } from '@/shared/components/ui/info-card'

interface SecurityTabProps {
  socialMedia: SocialMedia
}

export const SecurityTab: React.FC<SecurityTabProps> = ({ socialMedia }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoCard icon={<ShieldIcon />} title="Security Status">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Risk Level</span>
              <span className="text-sm px-2 py-1 bg-gray-100 rounded text-gray-700">
                Coming Soon
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Password Management</span>
              <span className="text-sm px-2 py-1 bg-gray-100 rounded text-gray-700">
                {socialMedia.passwordManagementPractice}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Third Party Management</span>
              <span className="text-sm px-2 py-1 bg-gray-100 rounded text-gray-700">
                {socialMedia.thirdPartyManagement || 'Not specified'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Business ID</span>
              <span className="text-sm px-2 py-1 bg-gray-100 rounded text-gray-700">
                {socialMedia.businessId || 'Not specified'}
              </span>
            </div>
          </div>
        </InfoCard>

        <InfoCard title="Security Recommendations">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CircleCheck className="text-blue-600" />
              <div>
                <div className="text-sm font-medium text-blue-600">Regular Audit Schedule</div>
                <div className="text-xs text-gray-500">Coming Soon</div>
              </div>
            </div>
          </div>
        </InfoCard>
      </div>
    </div>
  )
}
