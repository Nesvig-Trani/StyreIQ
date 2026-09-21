'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { getUsersByRoles } from '@/features/users/plugins/queries'
import { UserRolesEnum } from '@/features/users'
import type { User } from '@/types/payload-types'

const ASSIGNABLE_ROLES = [
  UserRolesEnum.SuperAdmin,
  UserRolesEnum.UnitAdmin,
  UserRolesEnum.SocialMediaManager,
]

export function useRefreshableUsers(initialUsers: User[]) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshUsers = async () => {
    setIsRefreshing(true)
    try {
      const result = await getUsersByRoles(ASSIGNABLE_ROLES)
      setUsers(result.docs)
    } catch {
      toast.error('Could not refresh the users list, please try again')
    } finally {
      setIsRefreshing(false)
    }
  }

  return { users, refreshUsers, isRefreshing }
}
