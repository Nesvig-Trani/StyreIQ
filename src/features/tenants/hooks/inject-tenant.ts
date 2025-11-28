import type { FieldHook } from 'payload'

export const injectTenantHook: FieldHook = async ({ req, data, operation, value }) => {
  if (value) return value

  if (operation === 'create' && req.user?.tenant) {
    return req.user.tenant
  }

  if (operation === 'update') {
    return data?.tenant || value
  }

  return value
}
