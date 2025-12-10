import type { FieldHook } from 'payload'
import { extractTenantId } from '../plugins/collections/helpers/access-control-helpers'

export const injectTenantHook: FieldHook = async ({ req, data, operation, value }) => {
  if (value) return value

  if (operation === 'create' && req.user?.tenant) {
    return extractTenantId(req.user)
  }

  if (operation === 'update') {
    return data?.tenant || value
  }

  return value
}
