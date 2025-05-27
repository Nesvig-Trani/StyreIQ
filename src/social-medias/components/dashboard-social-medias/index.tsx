import React from 'react'
import Link from 'next/link'

import { CirclePlus } from 'lucide-react'

//Components
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { SocialMediasTable } from '@/social-medias'

//Interfaces and types
import type { PaginatedDocs } from 'payload'
import type { SocialMedia, User } from '@/payload-types'

import { UserRolesEnum } from '@/users'

export type DashboardSocialMediasProps = {
  user: User | null
  socialMedias: PaginatedDocs<SocialMedia>
}

export const DashboardSocialMedias: React.FC<DashboardSocialMediasProps> = ({
  user,
  socialMedias,
}) => {
  return (
    <>
      <div>
        <Card>
          <CardContent>
            {user?.role &&
              [UserRolesEnum.SuperAdmin, UserRolesEnum.UnitAdmin].includes(user.role as UserRolesEnum) && (
                <div className="flex justify-end">
                  <Button>
                    <Link
                      title="create social media account"
                      className="flex items-center"
                      href="/dashboard/social-medias/create"
                    >
                      <CirclePlus className="mr-2" />
                      Create
                    </Link>
                  </Button>
                </div>
              )}
            <SocialMediasTable
              user={user}
              data={socialMedias.docs}
              pagination={{
                pageSize: socialMedias.limit,
                pageIndex: socialMedias.page ? socialMedias.page - 1 : 0,
                total: socialMedias.totalDocs,
                pageCount: socialMedias.totalPages,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
