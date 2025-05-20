import { Organization } from '@/payload-types'

export type OrganizationWithChildren = Organization & {
  parentOrg?: number
  children?: OrganizationWithChildren[]
}
