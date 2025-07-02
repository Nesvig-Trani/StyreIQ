import { ColumnDef } from '@tanstack/react-table'
import type { Organization, SocialMedia, User } from '@/payload-types'
import { Badge } from '@/shared/components/ui/badge'
import {
  ActionsRowSocialMedia,
  SocialMediaStatusEnum,
  statusClassMap,
  statusColorMap,
  statusLabelMap,
} from '@/social-medias'

export function useSocialMediasTable(user: User | null): { columns: ColumnDef<SocialMedia>[] } {
  const columns: ColumnDef<SocialMedia>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'status',
      header: 'Status',
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
      cell: ({ row }) => {
        const organization = row.getValue('organization') as Organization
        return <Badge>{organization.name}</Badge>
      },
    },
    {
      accessorKey: 'profileUrl',
      header: 'Profile URL',
      cell: ({ row }) => <Badge variant="outline">{row.getValue('profileUrl')}</Badge>,
    },
    {
      accessorKey: 'primaryAdmin',
      header: 'Administrator',
      cell: ({ row }) => {
        const admin = (row.getValue('primaryAdmin') as User) || { name: '-' }
        return <span>{admin.name}</span>
      },
    },
    {
      accessorKey: 'contactEmail',
      header: 'Contact Email',
      cell: ({ row }) => row.getValue('contactEmail') || '-',
    },
    {
      accessorKey: 'contactPhone',
      header: 'Contact Phone',
      cell: ({ row }) => row.getValue('contactPhone') || '-',
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
  }
}
