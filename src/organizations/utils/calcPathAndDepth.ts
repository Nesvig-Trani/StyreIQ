import { BasePayload } from 'payload'

export const calcParentPathAndDepth = async ({
  payload,
  parentOrg,
  id,
}: {
  payload: BasePayload
  parentOrg: number
  id: number
  name: string
}): Promise<{ parentDepth: number; parentPath: string }> => {
  let parentPath = ''
  let parentDepth = 0
  if (!parentOrg) {
    return { parentDepth: 0, parentPath: '' }
  }
  const parent = await payload.findByID({
    collection: 'organization',
    id: parentOrg,
  })

  if (!parent) throw new Error('Parent organization not found')

  if (parent.path?.includes(id.toString())) {
    throw new Error('Invalid parent: would create a circular hierarchy')
  }

  parentPath = parent.path || ''
  parentDepth = parent.depth || 0
  return { parentPath, parentDepth }
}
