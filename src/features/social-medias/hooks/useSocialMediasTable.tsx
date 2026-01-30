import { ColumnDef } from '@tanstack/react-table'
import type { Organization, SocialMedia, User, Tenant } from '@/types/payload-types'
import { Badge, DataTableFilter, useParsedSearchParams } from '@/shared'
import {
  ActionsRowSocialMedia,
  SocialMediaStatusEnum,
  statusClassMap,
  statusColorMap,
  statusLabelMap,
  statusOptions,
  socialMediaSearchSchema,
  PlatformEnum,
} from '@/features/social-medias'
import { platformOptions } from '@/features/social-medias/constants/platformOptions'
import { platformLabels } from '@/features/social-medias/constants/platformLabels'

export function useSocialMediasTable({
  user,
  organizations,
  users,
  tenants,
  isViewingAllTenants,
}: {
  user: User | null
  organizations: Organization[]
  users: User[]
  tenants?: Tenant[]
  isViewingAllTenants?: boolean
}) {
  const searchParams = useParsedSearchParams(socialMediaSearchSchema)

  const columnFiltersDefs: DataTableFilter[] = [
    {
      id: 'status',
      title: 'Status',
      type: 'select',
      allowMultiple: true,
      options: statusOptions,
    },
    {
      id: 'platform',
      title: 'Platform',
      type: 'select',
      allowMultiple: true,
      options: platformOptions,
    },
    {
      id: 'organization',
      title: 'Unit',
      type: 'select',
      allowMultiple: true,
      options: organizations.map((org) => ({
        label: org.name,
        value: org.id.toString(),
      })),
    },
    {
      id: 'primaryAdmin',
      title: 'Administrator',
      type: 'select',
      allowMultiple: true,
      options: users.map((user) => ({
        label: user.name,
        value: user.id.toString(),
      })),
    },
  ]

  if (isViewingAllTenants && tenants && tenants.length > 0) {
    columnFiltersDefs.push({
      id: 'tenant',
      title: 'Tenant',
      type: 'select',
      allowMultiple: true,
      options: tenants.map((tenant) => ({
        label: tenant.name,
        value: tenant.id.toString(),
      })),
    })
  }

  const columns: ColumnDef<SocialMedia>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      enableColumnFilter: true,
    },
    {
      accessorKey: 'platform',
      header: 'Platform',
      enableColumnFilter: true,
      cell: ({ row }) => {
        const platform = row.getValue('platform') as PlatformEnum
        return <Badge variant="outline">{platformLabels[platform] || 'Other'}</Badge>
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      enableColumnFilter: true,
      cell: ({ row }) => {
        const status = row.getValue('status') as SocialMediaStatusEnum
        const color = statusColorMap[status] ?? 'yellow'
        return (
          <Badge className={`${statusClassMap[color]} capitalize`}>{statusLabelMap[status]}</Badge>
        )
      },
    },
    {
      accessorKey: 'organization',
      header: 'Unit',
      enableColumnFilter: true,
      cell: ({ row }) => {
        const organization = row.getValue('organization') as Organization
        return <Badge>{organization.name}</Badge>
      },
    },
    {
      accessorKey: 'primaryAdmin',
      header: 'Administrator',
      enableColumnFilter: true,
      cell: ({ row }) => {
        const admin = (row.getValue('primaryAdmin') as User) || { name: '-' }
        return <span>{admin.name}</span>
      },
    },
  ]

  if (isViewingAllTenants) {
    columns.push({
      accessorKey: 'tenant',
      header: 'Tenant',
      enableColumnFilter: true,
      cell: ({ row }) => {
        const tenant = row.original.tenant

        if (tenant && typeof tenant === 'object' && 'name' in tenant) {
          return (
            <Badge variant="outline" className="text-xs">
              {tenant.name}
            </Badge>
          )
        }

        return <span className="text-gray-400">-</span>
      },
    })
  }

  columns.push({
    accessorKey: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      return <ActionsRowSocialMedia socialMedia={row.original} user={user} />
    },
  })

  return {
    columns,
    columnFiltersDefs,
    searchParams,
  }
}
