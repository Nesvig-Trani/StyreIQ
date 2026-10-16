import { describe, expect, it } from 'vitest'
import {
  createFlagCommentSchema,
  createFlagSchema,
  FlagTypeEnum,
  flagsSearchSchema,
} from '../schemas'

const baseEntityFlag = {
  flagType: FlagTypeEnum.SECURITY_CONCERN,
  affectedEntityType: 'users',
  affectedEntity: '42',
  description: 'Contraseña compartida por WhatsApp',
  suggestedAction: 'Rotar la contraseña',
  assignedTo: '7',
  dueDate: '2026-11-15',
}

const lostAccountFlag = {
  flagType: FlagTypeEnum.LOST_INACCESSIBLE_ACCOUNT,
  accountUrl: 'https://instagram.com/uandina_artes',
  accountPlatform: 'instagram',
  accessIssue: 'El administrador anterior ya no trabaja aquí',
  description: 'Cuenta inaccesible',
  suggestedAction: 'Solicitar recuperación a Meta',
  assignedTo: '7',
  dueDate: '2026-11-15',
}

const issuesOf = (input: unknown) => {
  const result = createFlagSchema.safeParse(input)
  return result.success ? [] : result.error.issues.map((i) => [i.path.join('.'), i.message])
}

describe('createFlagSchema', () => {
  it('should accept a complete flag about an affected entity', () => {
    expect(createFlagSchema.safeParse(baseEntityFlag).success).toBe(true)
  })

  it('should require the affected entity type and entity for regular flags', () => {
    expect(
      issuesOf({ ...baseEntityFlag, affectedEntityType: undefined, affectedEntity: undefined }),
    ).toEqual([
      ['affectedEntityType', 'Affected Entity Type is required'],
      ['affectedEntity', 'Affected entity is required'],
    ])
  })

  it('should require an assignee and a due date', () => {
    expect(issuesOf({ ...baseEntityFlag, assignedTo: '', dueDate: '' })).toEqual([
      ['assignedTo', 'Assigned To is required'],
      ['dueDate', 'Due Date is required'],
    ])
  })

  it('should accept a complete lost account flag without an affected entity', () => {
    expect(createFlagSchema.safeParse(lostAccountFlag).success).toBe(true)
  })

  it('should accept a lost account flag without a risk description', () => {
    const { description: _description, ...withoutDescription } = lostAccountFlag

    expect(createFlagSchema.safeParse(withoutDescription).success).toBe(true)
    expect(createFlagSchema.safeParse({ ...lostAccountFlag, description: '' }).success).toBe(true)
  })

  it('should require url, platform and access issue for lost accounts', () => {
    expect(
      issuesOf({
        ...lostAccountFlag,
        accountUrl: undefined,
        accountPlatform: undefined,
        accessIssue: '   ',
      }),
    ).toEqual([
      ['accountUrl', 'Enter a valid account URL starting with http:// or https://'],
      ['accountPlatform', 'Platform is required'],
      ['accessIssue', 'Access Issue is required'],
    ])
  })

  it.each([
    'javascript:alert(1)',
    'data:text/html,hola',
    'instagram.com/uandina',
    'ftp://files.uandina.edu',
  ])('should reject %s as an account url', (accountUrl) => {
    expect(issuesOf({ ...lostAccountFlag, accountUrl })).toEqual([
      ['accountUrl', 'Enter a valid account URL starting with http:// or https://'],
    ])
  })

  it('should reject unknown flag types', () => {
    expect(createFlagSchema.safeParse({ ...baseEntityFlag, flagType: 'made_up' }).success).toBe(
      false,
    )
  })
})

describe('createFlagCommentSchema', () => {
  it('should require a numeric flag id', () => {
    expect(
      createFlagCommentSchema.safeParse({ flagId: '55', comment: 'Seguimiento' }).success,
    ).toBe(false)
    expect(createFlagCommentSchema.safeParse({ flagId: 55, comment: 'Seguimiento' }).success).toBe(
      true,
    )
  })
})

describe('flagsSearchSchema', () => {
  it('should fall back to empty date ranges when the params are malformed', () => {
    const parsed = flagsSearchSchema.parse({
      detectionDate: 'not-an-object',
      lastActivity: { from: 5, to: null },
    })

    expect(parsed.detectionDate).toEqual({ from: '', to: '' })
    expect(parsed.lastActivity).toEqual({ from: '', to: '' })
  })

  it('should keep valid filters', () => {
    const parsed = flagsSearchSchema.parse({
      flagType: ['missing_2fa'],
      status: ['pending'],
      organizations: ['100'],
      detectionDate: { from: '2026-09-01', to: '2026-09-30' },
      lastActivity: { from: '', to: '' },
    })

    expect(parsed).toMatchObject({
      flagType: ['missing_2fa'],
      status: ['pending'],
      organizations: ['100'],
      detectionDate: { from: '2026-09-01', to: '2026-09-30' },
    })
  })

  it('should reject unknown statuses', () => {
    expect(
      flagsSearchSchema.safeParse({
        status: ['archived'],
        detectionDate: { from: '', to: '' },
        lastActivity: { from: '', to: '' },
      }).success,
    ).toBe(false)
  })
})
