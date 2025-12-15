import type { FieldHook } from 'payload'
import {
  extractTenantId,
  getSelectedTenantFromRequest,
} from '../plugins/collections/helpers/access-control-helpers'
import { UserRolesEnum } from '@/features/users'

export const injectTenantHook: FieldHook = async ({ req, data, operation, value }) => {
  if (value) return value

  if (operation === 'create') {
    const user = req.user

    if (!user) return value
    if (user.role === UserRolesEnum.SuperAdmin) {
      const selectedTenantId = getSelectedTenantFromRequest(req)

      if (selectedTenantId) {
        return selectedTenantId
      }

      return null
    }

    if (user.tenant) {
      const tenantId = extractTenantId(user)
      return tenantId
    }
  }

  if (operation === 'update') {
    return data?.tenant || value
  }

  return value
}
