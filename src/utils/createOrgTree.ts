import { PaginatedDocs } from 'payload'
import { Organization } from '@/payload-types'
import { OrganizationWithChildren, Tree } from '@/types/organizations'

export const CreateOrganizationsTree = (allOrganizations: PaginatedDocs<Organization>): Tree[] => {
  const organizations = allOrganizations.docs as OrganizationWithChildren[]

  const orgMap: Record<string, Tree> = {}
  organizations.forEach((org) => {
    orgMap[org.id] = {
      id: org.id,
      parent: org.parentOrg || 0,
      name: org.name,
      depth: org.depth || 0,
      children: [],
    }
  })

  const tree: Tree[] = []
  organizations.forEach((org) => {
    if (org.parentOrg && orgMap[org.parentOrg]) {
      orgMap[org.parentOrg].children.push(orgMap[org.id])
    } else {
      tree.push(orgMap[org.id])
    }
  })
  return tree
}
