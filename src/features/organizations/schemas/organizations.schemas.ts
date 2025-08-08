import { Organization, User } from '@/types/payload-types'
import { z } from 'zod'
import { paginationSchema } from '@/shared/schemas/pagination'
import { statusConfig } from '../constants/statusConfig'
import { typeConfig } from '../constants/typeConfig'
import { UserRolesEnum } from '@/features/users'

export enum OrganizationTypeEnum {
  HIGHER_EDUCATION_INSTITUTION = 'higher_education_institution',
  GOVERNMENT_AGENCY = 'government_agency',
  HEALTHCARE_SYSTEM = 'healthcare_system',
  CORPORATE_ENTERPRISE = 'corporate_enterprise',
  NONPROFIT_ORGANIZATION = 'nonprofit_organization',
  DIVISION = 'division',
  SCHOOL_FACULTY = 'school_faculty',
  DEPARTMENT = 'department',
  OFFICE = 'office',
  PROGRAM = 'program',
  INITIATIVE = 'initiative',
  OTHER = 'other',
}

const OrganizationType = z.nativeEnum(OrganizationTypeEnum)

export const createOrgFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, "Organization name can\'t exceed 100 characters"),
  type: OrganizationType,
  parent: z.string().optional(),
  admin: z.string().min(1, 'Admin is required'),
  backupAdmins: z.string().array().optional(),
  email: z.string().email().or(z.literal('')).optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .or(z.literal(''))
    .optional(),
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

export type OrganizationWithDepth = {
  parentOrg: Organization
  admin: User
  backupAdmins?: User[]
  children?: { docs: Organization[] }
} & Organization

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
  userRole?: UserRolesEnum
  users: User[]
  organizations: Organization[]
}

export type UpdateOrgFormProps = {
  users: User[]
  data?: OrganizationWithDepth | null
  organizations: OrganizationWithDepth[]
  user?: User | null
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
