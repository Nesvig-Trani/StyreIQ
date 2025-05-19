import React from 'react'
import { CreateOrgForm } from '@/components/organizations/createOrgForm'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Card } from '@/components/ui/card'
import { Organization } from '@/payload-types'

export type OrganizationWithChildren = Organization & {
  parentOrg?: number
  children?: OrganizationWithChildren[]
}

export default async function CreateOrganization() {
  const payload = await getPayload({ config })

  const users = await payload.find({
    collection: 'users',
  })

  const allOrganizations = await payload.find({
    collection: 'organization',
    depth: 0,
    select: {
      id: true,
      name: true,
      parentOrg: true,
      depth: true,
      path: true,
    },
  })

  const organizations = allOrganizations.docs as OrganizationWithChildren[]

  const orgMap: Record<string, OrganizationWithChildren> = {}
  organizations.forEach((org) => {
    org.children = []
    orgMap[org.id] = org
  })

  const tree: OrganizationWithChildren[] = []
  organizations.forEach((org) => {
    if (org.parentOrg && orgMap[org.parentOrg]) {
      orgMap[org.parentOrg].children!.push(org)
    } else {
      tree.push(org)
    }
  })
  return (
    <div>
      <h1>Create Organization</h1>
      <Card>
        <CreateOrgForm users={users.docs} tree={tree} organizations={organizations} />
      </Card>
    </div>
  )
}
