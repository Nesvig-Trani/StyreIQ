import { CreateOrganizationsTree, UnitWithDepth } from '@/features/organizations'
import { filterTreeWithSearch } from './filterTree'

export const treePaginationAndFilter = ({
  organizations,
  search,
  pageIndex,
  pageSize,
}: {
  organizations: UnitWithDepth[]
  search?: string
  pageIndex: number
  pageSize: number
}) => {
  const fullTree = CreateOrganizationsTree(organizations)
  const filteredTree = search ? filterTreeWithSearch(fullTree, search) : fullTree

  const start = Math.max(pageIndex - 1, 0) * pageSize
  const end = start + pageSize
  const paginatedOrgs = filteredTree.slice(start, end)

  return {
    docs: paginatedOrgs,
    limit: pageSize,
    page: pageIndex,
    totalDocs: fullTree.length,
    totalPages: Math.ceil(fullTree.length / pageSize),
  }
}
