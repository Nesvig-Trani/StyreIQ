import { AuditLog } from '@/payload-types'
import { CollectionAfterChangeHook } from 'payload'
import { AuditLogCollectionKey } from '@payload-config'

const AuditLogAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  collection,
  operation,
  req,
}) => {
  setTimeout(async () => {
    try {
      if (!req.user) return doc
      const data: Omit<AuditLog, 'createdAt' | 'updatedAt' | 'id'> = {
        user: req.user?.id,
        action: operation,
        entity: collection.slug,
        document: {
          relationTo: collection.slug as AuditLogCollectionKey,
          value: doc.id,
        },
      }
      if (operation === 'update') {
        data.prev = previousDoc
        data.current = doc
      }
      await req.payload.create({
        collection: 'audit_log',
        data: {
          ...data,
        },
      })
    } catch (err) {
      console.error('Audit log creation failed:', err)
    }
  }, 0)

  return doc
}

export default AuditLogAfterChange
