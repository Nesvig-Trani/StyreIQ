import { Organization } from '@/payload-types'

export type OrganizationWithChildren = Organization & {
  parentOrg?: number
  children?: OrganizationWithChildren[]
}

export type Tree = {
  id: number | string
  parent: number
  name: string
  depth: number
  children: Tree[]
}
