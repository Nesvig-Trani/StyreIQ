import type { PayloadHandler } from 'payload'

export const tenantContextMiddleware: PayloadHandler = async (request) => {
  const { user } = request

  if (user?.tenant) {
    request.context = {
      ...request.context,
      tenantId: user.tenant,
    }
  }

  return new Response(null, {
    status: 200,
    headers: user?.tenant ? { 'X-Tenant-ID': String(user.tenant) } : undefined,
  })
}
