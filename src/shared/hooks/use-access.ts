import { useCallback } from 'react'
import { AccessControl } from '../utils/rbac'
import { Resource, ResourceAction } from '../constants/rbac'
import { User } from '@/types/payload-types'

export function useAccess(user: User) {
  const checkAccess = useCallback(
    (action: ResourceAction, resource: Resource, unitId?: number) => {
      const access = new AccessControl(user)
      return access.can(action, resource, unitId)
    },
    [user],
  )

  return { can: checkAccess }
}
