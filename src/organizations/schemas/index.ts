import { Organization, User } from '@/payload-types'
import { z } from 'zod'
import { paginationSchema } from '@/schemas/pagination'
import { statusConfig } from '../constants/statusConfig'
import { typeConfig } from '../constants/typeConfig'

export const createOrgFormSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['university', 'faculty', 'department', 'office', 'project']),
  parent: z.string().optional(),
  admin: z.string().optional(),
  backupAdmins: z.string().array().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending_review']),
  description: z.string().optional(),
  delegatedPermissions: z.boolean().optional(),
})
export const updateOrgFormSchema = createOrgFormSchema.extend({
  id: z.number(),
})

export type OrganizationWithChildren = Organization & {
  parentOrg?: number
  children?: OrganizationWithChildren[]
}

export type OrganizationWithDepth =  {
  parentOrg: Organization
  admin: User
  backupAdmins?: User[]
  children?: { docs: Organization[]}
}  & Organization

export type Tree = {
  id: number
  parent: number
  name: string
  depth: number
  admin: User
  status: string
  type: string
  children: Tree[]
}

export type CreateOrgFormProps = {
  users: User[]
  organizations: Organization[]
}

export type UpdateOrgFormProps = {
  users: User[]
  data?: OrganizationWithDepth | null
  organizations: OrganizationWithDepth[]
  user?: User | null,
}

export const organizationSearchSchema = paginationSchema.extend({
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending_review']).optional(),
  type: z.enum(['university', 'faculty', 'department', 'office', 'project']).optional(),
})


export type StatusType = keyof typeof statusConfig
export type OrganizationType = keyof typeof typeConfig

export interface FlattenedTree extends Tree {
  level: number
  originalData?: OrganizationWithChildren
}

export interface OrganizationHierarchyProps {
  organizations: Tree[]
  originalData: OrganizationWithDepth[]
  users: User[]
  user?: User | null
  pagination: {
    pageSize: number
    pageIndex: number
    total: number
    pageCount: number
  }
}

export type CreateOrganization = z.infer<typeof createOrgFormSchema>
