import { OrganizationWithDepth, Tree } from '@/features/organizations'

export const CreateOrganizationsTree = (organizations: OrganizationWithDepth[]): Tree[] => {
  const orgMap: Record<string, Tree> = {}
  organizations.forEach((org) => {
    orgMap[org.id] = {
      id: org.id,
      parent: org.parentOrg?.id || 0,
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
