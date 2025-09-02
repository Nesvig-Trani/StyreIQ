import { AuditLog } from '@/types/payload-types'

type WithIdAndOptionalName = { id: number; name?: string }
type WithFlagType = { id: number; flagType?: string }

function hasId(value: unknown): value is WithIdAndOptionalName | WithFlagType {
  return typeof value === 'object' && value !== null && 'id' in value
}

type LabelResolver<T> = (val: T) => string | undefined

function getDocumentOptions(
  auditLogs: AuditLog[],
  entity: string,
  resolveLabel: LabelResolver<WithIdAndOptionalName | WithFlagType>,
) {
  const logs = auditLogs.filter((log) => log.entity === entity)
  const unique = new Map<number, string>()
  logs.forEach((log) => {
    const val = log.document?.value
    if (hasId(val)) {
      const label = resolveLabel(val)
      if (label && !unique.has(val.id)) {
        unique.set(val.id, label)
      }
    }
  })
  return Array.from(unique.entries()).map(([id, name]) => ({
    value: id.toString(),
    label: name,
  }))
}

export const getUserDocumentOptions = (auditLogs: AuditLog[]) =>
  getDocumentOptions(auditLogs, 'users', (val) =>
    'name' in val && typeof val.name === 'string' ? val.name : undefined,
  )

export const getOrganizationDocumentOptions = (auditLogs: AuditLog[]) =>
  getDocumentOptions(auditLogs, 'organization', (val) =>
    'name' in val && typeof val.name === 'string' ? val.name : undefined,
  )

export const getSocialMediaDocumentOptions = (auditLogs: AuditLog[]) =>
  getDocumentOptions(auditLogs, 'social-medias', (val) =>
    'name' in val && typeof val.name === 'string'
      ? val.name
      : 'flagType' in val && typeof val.flagType === 'string'
        ? val.flagType
        : `Social Media ${val.id}`,
  )
