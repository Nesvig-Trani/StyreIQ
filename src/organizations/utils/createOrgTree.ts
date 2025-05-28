import { OrganizationWithChildren, Tree } from '@/organizations'

export const CreateOrganizationsTree = (organizations: OrganizationWithChildren[]): Tree[] => {
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
