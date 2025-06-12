import { OrganizationWithChildren, Tree } from '@/organizations'
import { Organization, User } from '@/payload-types'

type OrganizationsWithDepth = OrganizationWithChildren & {
  parentOrg: Organization
  admin: User
  backupAdmins: User[]
}

export const CreateOrganizationsTree = (organizations: OrganizationsWithDepth[]): Tree[] => {
  const orgMap: Record<string, Tree> = {}
  organizations.forEach((org) => {
    orgMap[org.id] = {
      id: org.id,
      parent: org.parentOrg || 0,
      name: org.name,
      depth: org.depth || 0,
      admin: org.admin,
      status: org.status || '',
      type: org.type || '',
      children: [],
    }
  })

  const tree: Tree[] = []
  organizations.forEach((org) => {
    if (org.parentOrg && org.parentOrg?.id && orgMap[org.parentOrg?.id]) {
      orgMap[org.parentOrg.id].children.push(orgMap[org.id])
    } else {
      tree.push(orgMap[org.id])
    }
  })
  return tree
}
