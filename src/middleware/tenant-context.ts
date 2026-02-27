import type { PayloadHandler } from 'payload'

export const tenantContextMiddleware: PayloadHandler = async (request) => {
  if (request.url?.includes('payload-jobs')) {
    return new Response(null, { status: 200 })
  }

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
