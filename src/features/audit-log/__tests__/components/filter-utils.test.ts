import { describe, expect, it } from 'vitest'
import {
  getOrganizationDocumentOptions,
  getSocialMediaDocumentOptions,
  getUserDocumentOptions,
} from '../../components/audit-logs-table/filterUtils'
import { buildAuditLog, buildSocialMediaAccount } from '../fixtures'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'

const logs = [
  buildAuditLog({
    id: 1,
    entity: 'users',
    document: { relationTo: 'users', value: buildUser({ id: 31, name: 'Camila Ortega' }) },
  }),
  buildAuditLog({
    id: 2,
    entity: 'users',
    document: { relationTo: 'users', value: buildUser({ id: 31, name: 'Camila Ortega' }) },
  }),
  buildAuditLog({
    id: 3,
    entity: 'users',
    document: { relationTo: 'users', value: 32 },
  }),
  buildAuditLog({
    id: 4,
    entity: 'organization',
    document: {
      relationTo: 'organization',
      value: buildOrganization({ id: 100, name: 'Dirección de Comunicaciones' }),
    },
  }),
  buildAuditLog({ id: 5, entity: 'organization' }),
]

describe('audit log document filter options', () => {
  it('should list each affected user once, ignoring unpopulated references', () => {
    expect(getUserDocumentOptions(logs)).toEqual([{ value: '31', label: 'Camila Ortega' }])
  })

  it('should list affected units by name', () => {
    expect(getOrganizationDocumentOptions(logs)).toEqual([
      { value: '100', label: 'Dirección de Comunicaciones' },
    ])
  })

  it('should return nothing when no log targets that entity', () => {
    expect(getSocialMediaDocumentOptions(logs)).toEqual([])
  })

  it('should list affected social media accounts by name', () => {
    const socialMediaLogs = [
      buildAuditLog({
        id: 6,
        entity: 'social-medias',
        document: { relationTo: 'social-medias', value: buildSocialMediaAccount({ id: 8 }) },
      }),
    ]
    expect(getSocialMediaDocumentOptions(socialMediaLogs)).toEqual([
      { value: '8', label: 'Instagram Universidad Andina' },
    ])
  })
})
