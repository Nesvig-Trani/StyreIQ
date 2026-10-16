import { describe, expect, it } from 'vitest'
import { createUnitTree } from '../../utils/createUnitTree'
import { filterTreeWithSearch } from '../../utils/filterTree'
import { treePaginationAndFilter } from '../../utils/treePaginationAndFilter'
import type { UnitWithDepth } from '../../schemas'
import type { Organization, User } from '@/types/payload-types'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'

const universidad = buildOrganization({
  id: 1,
  name: 'Universidad Andina',
  type: 'higher_education_institution',
  path: '/1',
})
const facultadArtes = buildOrganization({
  id: 2,
  name: 'Facultad de Artes',
  type: 'school_faculty',
  path: '/1/2',
  depth: 1,
})
const departamentoMusica = buildOrganization({
  id: 3,
  name: 'Departamento de Música',
  type: 'department',
  path: '/1/2/3',
  depth: 2,
})
const biblioteca = buildOrganization({
  id: 4,
  name: 'Biblioteca Central',
  type: 'office',
  path: '/4',
})

const rafael = buildUser({ id: 7, name: 'Rafael Mejía' })

const toUnit = (
  org: Organization,
  parentOrg: Organization,
  admin: User | null = null,
): UnitWithDepth => ({
  ...org,
  parentOrg,
  admin,
  backupAdmins: undefined,
  children: undefined,
})

const organizations: UnitWithDepth[] = [
  toUnit(universidad, { ...universidad, id: 0 }),
  toUnit(facultadArtes, universidad),
  toUnit(departamentoMusica, facultadArtes, rafael),
  toUnit(biblioteca, { ...biblioteca, id: 0 }),
]

describe('createUnitTree', () => {
  it('should nest units under their parent and keep roots at the top level', () => {
    const tree = createUnitTree(organizations)
    expect(tree.map((n) => n.name)).toEqual(['Universidad Andina', 'Biblioteca Central'])
    expect(tree[0].children.map((n) => n.name)).toEqual(['Facultad de Artes'])
    expect(tree[0].children[0].children.map((n) => n.name)).toEqual(['Departamento de Música'])
  })

  it('should treat a unit whose parent is not in the list as a root', () => {
    const orphan = toUnit(departamentoMusica, buildOrganization({ id: 999 }))
    expect(createUnitTree([orphan]).map((n) => n.id)).toEqual([departamentoMusica.id])
  })

  it('should carry depth, status and the unit admin', () => {
    const [, , musica] = organizations
    const [node] = createUnitTree([toUnit(musica, buildOrganization({ id: 999 }), rafael)])
    expect(node).toMatchObject({ depth: 2, status: 'active', type: 'department', admin: rafael })
  })
})

describe('filterTreeWithSearch', () => {
  const tree = createUnitTree(organizations)

  it('should keep the ancestors of a matching descendant', () => {
    const result = filterTreeWithSearch(tree, 'música')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Universidad Andina')
    expect(result[0].children[0].children[0].name).toBe('Departamento de Música')
  })

  it('should match on the unit admin name, case-insensitively', () => {
    const result = filterTreeWithSearch(tree, 'RAFAEL')
    expect(result[0].children[0].children[0].name).toBe('Departamento de Música')
  })

  it('should return every child of a matching unit', () => {
    const result = filterTreeWithSearch(tree, 'facultad de artes')
    expect(result[0].children[0].children).toHaveLength(1)
  })

  it('should return an empty list when nothing matches', () => {
    expect(filterTreeWithSearch(tree, 'Medicina')).toEqual([])
  })
})

describe('treePaginationAndFilter', () => {
  it('should paginate root units and report totals', () => {
    const page1 = treePaginationAndFilter({ organizations, pageIndex: 1, pageSize: 1 })
    expect(page1.docs.map((d) => d.name)).toEqual(['Universidad Andina'])
    expect(page1).toMatchObject({ limit: 1, page: 1, totalDocs: 2, totalPages: 2 })

    const page2 = treePaginationAndFilter({ organizations, pageIndex: 2, pageSize: 1 })
    expect(page2.docs.map((d) => d.name)).toEqual(['Biblioteca Central'])
  })

  it('should clamp page indexes below 1 to the first page', () => {
    const result = treePaginationAndFilter({ organizations, pageIndex: 0, pageSize: 10 })
    expect(result.docs).toHaveLength(2)
  })

  it('should apply the search before paginating', () => {
    const result = treePaginationAndFilter({
      organizations,
      search: 'biblioteca',
      pageIndex: 1,
      pageSize: 10,
    })
    expect(result.docs.map((d) => d.name)).toEqual(['Biblioteca Central'])
  })
})
