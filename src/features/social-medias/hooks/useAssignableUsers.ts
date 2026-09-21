'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { getUsersByOrganizationAndRole } from '@/features/users/plugins/queries'
import type { User } from '@/types/payload-types'
import { ASSIGNABLE_USER_ROLES, ASSIGNABLE_USER_STATUSES } from '../constants/assignable-users'

export function useAssignableUsers(organizationId: string | null) {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const latestRequestId = useRef(0)

  const loadUsers = useCallback(async () => {
    const requestId = ++latestRequestId.current

    if (!organizationId) {
      setUsers([])
      return
    }

    setIsLoading(true)
    try {
      const result = await getUsersByOrganizationAndRole({
        organizationId: Number(organizationId),
        roles: ASSIGNABLE_USER_ROLES,
        statuses: ASSIGNABLE_USER_STATUSES,
      })
      // Ignore responses that arrive after the unit changed again
      if (requestId !== latestRequestId.current) return
      setUsers(result.docs)
    } catch {
      if (requestId !== latestRequestId.current) return
      toast.error('Could not load the users of the selected unit, please try again')
    } finally {
      if (requestId === latestRequestId.current) setIsLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  return { users, refreshUsers: loadUsers, isLoading }
}
