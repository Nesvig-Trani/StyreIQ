import { CollectionBeforeChangeHook } from 'payload'

const AuditLogBeforeChange: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
  operation,
  collection,
  context,
}) => {
  if (operation === 'update' && originalDoc.id) {
    const prev = await req.payload.findByID({
      collection: collection.slug,
      id: originalDoc.id,
      depth: 2,
    })
    context.prev = prev
  }
  return data
}

export default AuditLogBeforeChange
