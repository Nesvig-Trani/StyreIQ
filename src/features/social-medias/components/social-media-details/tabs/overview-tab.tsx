import React from 'react'
import { SquareArrowOutUpRight, UsersIcon, SettingsIcon } from 'lucide-react'
import { Badge } from '@/shared'
import type { SocialMedia } from '@/types/payload-types'
import { InfoField } from '@/shared/components/ui/info-field'
import { InfoCard } from '@/shared/components/ui/info-card'
import { LatestPost } from './overview-tab/latest-post'

interface OverviewTabProps {
  socialMedia: SocialMedia
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ socialMedia }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoCard
          icon={<SquareArrowOutUpRight className="h-4 w-4 text-black" />}
          title="Account Information"
        >
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <InfoField label="Platform" value={socialMedia.platform} />
              <InfoField label="Business ID" value={socialMedia.businessId} />
              <InfoField label="Profile URL" value={socialMedia.profileUrl} />
            </div>
            <div className="space-y-4">
              <InfoField label="Handle" value={socialMedia.accountHandle} />
              <InfoField label="Verification" value={socialMedia.verificationStatus} />
              <InfoField
                label="Creation Date"
                value={
                  socialMedia.creationDate
                    ? new Date(socialMedia.creationDate).toLocaleDateString()
                    : null
                }
              />
            </div>
          </div>
        </InfoCard>

        <InfoCard
          icon={<UsersIcon className="h-4 w-4 text-black" />}
          title="Ownership & Management"
        >
          <div className="space-y-4">
            <InfoField
              label="Assigned Unit"
              value={
                typeof socialMedia.organization === 'object' &&
                socialMedia.organization !== null &&
                'name' in socialMedia.organization
                  ? socialMedia.organization.name
                  : 'Not specified'
              }
            />
            <InfoField
              label="Primary Administrator"
              value={
                typeof socialMedia.primaryAdmin === 'object' && socialMedia.primaryAdmin !== null
                  ? socialMedia.primaryAdmin.name
                  : 'Not specified'
              }
            />
            <InfoField
              label="Backup Administrator"
              value={
                typeof socialMedia.backupAdmin === 'object' && socialMedia.backupAdmin !== null
                  ? socialMedia.backupAdmin.name
                  : 'Not specified'
              }
            />
            <InfoField
              label="Management Type"
              value={
                socialMedia.thirdPartyManagement === 'yes' ? (
                  <>
                    Yes
                    <br />
                    {socialMedia.thirdPartyProvider || 'Not specified'}
                    <br />
                    {socialMedia.thirdPartyContact || 'Not specified'}
                  </>
                ) : (
                  socialMedia.thirdPartyManagement
                )
              }
            />
          </div>
        </InfoCard>
      </div>

      {socialMedia.platform && socialMedia.accountHandle && (
        <LatestPost
          platform={socialMedia.platform}
          channelId={socialMedia.accountHandle}
          socialMediaId={socialMedia.id}
        />
      )}

      <InfoCard
        icon={<SettingsIcon className="h-4 w-4 text-black" />}
        title="Linked Tools & Integrations"
      >
        <div className="flex gap-2 flex-wrap">
          {(socialMedia.linkedTools ?? []).map((tool, index) => (
            <Badge key={index}>{tool}</Badge>
          ))}
        </div>

        <div className="mt-2">
          <span className="text-xs text-muted-foreground">
            Last updated:{' '}
            {socialMedia.updatedAt
              ? new Date(socialMedia.updatedAt).toLocaleDateString()
              : 'Not specified'}
          </span>
        </div>
      </InfoCard>
    </div>
  )
}
