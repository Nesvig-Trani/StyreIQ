import { ColumnDef } from '@tanstack/react-table'
import type { Organization, SocialMedia, User } from '@/payload-types'
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
} from '@/social-medias'
import { platformOptions } from '@/social-medias/constants/platformOptions'
import { platformLabels } from '@/social-medias/constants/platformLabels'

export function useSocialMediasTable({
  user,
  organizations,
  users,
}: {
  user: User | null
  organizations: Organization[]
  users: User[]
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
      title: 'Organization',
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
      header: 'Organization',
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
    {
      accessorKey: 'isInUseSecurePassword',
      header: 'Secure Password',
      enableColumnFilter: true,
      cell: ({ row }) => {
        const hasSecure = row.getValue('isInUseSecurePassword') as boolean
        return (
          <Badge variant={hasSecure ? 'default' : 'destructive'}>{hasSecure ? 'Yes' : 'No'}</Badge>
        )
      },
    },
    {
      accessorKey: 'isEnabledTwoFactor',
      header: 'Two Factor',
      enableColumnFilter: true,
      cell: ({ row }) => {
        const hasTwoFactor = row.getValue('isEnabledTwoFactor') as boolean
        return (
          <Badge variant={hasTwoFactor ? 'default' : 'destructive'}>
            {hasTwoFactor ? 'Yes' : 'No'}
          </Badge>
        )
      },
    },
  ]

  if (user?.role === 'super_admin') {
    columns.push({
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        return <ActionsRowSocialMedia socialMedia={row.original} user={user} />
      },
    })
  }

  return {
    columns,
    columnFiltersDefs,
    searchParams,
  }
}
