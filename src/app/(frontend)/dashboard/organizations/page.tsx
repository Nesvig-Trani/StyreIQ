import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { OrganizationTable } from '@/components/organizations/organizationTable'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function OrganizationsPage() {
  const payload = await getPayload({ config })
  const organizations = await payload.find({
    collection: 'organization',
    depth: 1,
  })
  return (
    <div>
      <Card>
        <div className={'flex justify-end'}>
          <Button>
            <Link href={'/dashboard/organizations/create'}>Create Organization</Link>
          </Button>
        </div>
        <CardContent>
          <OrganizationTable data={organizations.docs} />
        </CardContent>
      </Card>
    </div>
  )
}
