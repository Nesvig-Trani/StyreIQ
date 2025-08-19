import React from 'react'
import Link from 'next/link'

import { CirclePlus } from 'lucide-react'

//Components
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { SocialMediasTable } from '@/features/social-medias'
import { Badge } from '@/shared/components/ui/badge'

//Interfaces and types
import type { PaginatedDocs } from 'payload'
import type { AuditLog, Organization, SocialMedia, User } from '@/types/payload-types'

import { useAccess } from '@/shared/hooks/use-access'

export type SocialMediaWithAuditLogs = SocialMedia & {
  auditLogs?: AuditLog[]
}

export type SocialMediasPaginated = Omit<PaginatedDocs<SocialMedia>, 'docs'> & {
  docs: SocialMediaWithAuditLogs[]
}

export type DashboardSocialMediasProps = {
  user: User
  socialMedias: SocialMediasPaginated
  organizations: Organization[]
  users: User[]
}

export const DashboardSocialMedias: React.FC<DashboardSocialMediasProps> = ({
  user,
  socialMedias,
  organizations,
  users,
}) => {
  const { can } = useAccess(user)

  return (
    <Card>
      <CardContent>
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">Social Media Accounts</h2>
                <Badge variant="secondary" className="text-xs">
                  {socialMedias.totalDocs} Accounts
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Monitor and manage social media accounts, content, and engagement metrics
              </p>
            </div>
            <div className="w-full sm:w-auto">
              {can('create', 'SOCIAL_MEDIAS') && (
                <Button size="sm" className="w-full sm:w-auto">
                  <Link
                    title="create social media account"
                    className="flex items-center justify-center gap-2"
                    href="/dashboard/social-media-accounts/create"
                  >
                    <CirclePlus className="h-4 w-4" />
                    Create Social Media Account
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
        <SocialMediasTable
          user={user}
          data={socialMedias.docs}
          organizations={organizations}
          users={users}
          pagination={{
            pageSize: socialMedias.limit,
            pageIndex: socialMedias.page ? socialMedias.page - 1 : 0,
            total: socialMedias.totalDocs,
            pageCount: socialMedias.totalPages,
          }}
        />
      </CardContent>
    </Card>
  )
}
