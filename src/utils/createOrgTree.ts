import { PaginatedDocs } from 'payload'
import { Organization } from '@/payload-types'
import { OrganizationWithChildren } from '@/types/organizations'

export const CreateOrganizationsTree = (
  allOrganizations: PaginatedDocs<Organization>,
): OrganizationWithChildren[] => {
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

  return tree
}
