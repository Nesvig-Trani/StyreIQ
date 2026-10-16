import type { CollectionConfig, Field } from 'payload'
import { createFakeCollection, createFakeRequest } from '@/shared/__tests__/payload-fakes'
import type { buildUser } from '@/shared/__tests__/fixtures'
import { SELECTED_TENANT_COOKIE_NAME } from '@/features/tenants/schemas'

type RunOptions = {
  user: ReturnType<typeof buildUser> | null
  operation: 'create' | 'update'
  value?: number | null
  data?: { tenant?: number | null }
  selectedTenantCookie?: string
}

const findTenantField = (collection: CollectionConfig) => {
  const field = collection.fields.find(
    (candidate: Field) =>
      candidate.type === 'relationship' && 'name' in candidate && candidate.name === 'tenant',
  )
  if (!field || field.type !== 'relationship') {
    throw new Error(`tenant field missing in ${collection.slug}`)
  }
  return field
}

/** Runs the first beforeChange hook of the `tenant` field of a collection config. */
export const runTenantFieldHook = async (
  collection: CollectionConfig,
  { user, operation, value, data, selectedTenantCookie }: RunOptions,
) => {
  const field = findTenantField(collection)
  const hook = field.hooks?.beforeChange?.[0]
  if (!hook) throw new Error(`tenant beforeChange hook missing in ${collection.slug}`)

  const { fake, asRequest } = createFakeRequest({ user })
  if (selectedTenantCookie) {
    fake.headers.set('cookie', `${SELECTED_TENANT_COOKIE_NAME}=${selectedTenantCookie}`)
  }

  return hook({
    blockData: undefined,
    collection: createFakeCollection(collection.slug),
    context: {},
    data,
    field,
    global: null,
    indexPath: [],
    operation,
    path: ['tenant'],
    req: asRequest(),
    schemaPath: ['tenant'],
    siblingData: {},
    siblingFields: [],
    value,
  })
}
