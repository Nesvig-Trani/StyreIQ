// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest'
import { buildComplianceTask, buildOrganization, buildUser } from '@/shared/__tests__/fixtures'
import {
  createFakeCollection,
  createFakePayload,
  createFakeRequest,
} from '@/shared/__tests__/payload-fakes'
import type { FakePayload } from '@/shared/__tests__/payload-fakes'
import type { SocialMedia, User } from '@/types/payload-types'
import { buildSocialMedia } from '../../fixtures'
import { SocialMedias } from '../../../plugins/collections'

const afterChangeHook = SocialMedias.hooks?.afterChange?.[0]
const beforeChangeHook = SocialMedias.hooks?.beforeChange?.[0]
if (!afterChangeHook || !beforeChangeHook) {
  throw new Error('SocialMedias collection must define afterChange and beforeChange hooks')
}

const collection = createFakeCollection('social-medias')
const centralAdmin = buildUser({ id: 2, roles: ['central_admin'], tenant: 10 })
const manager = buildUser({ id: 3, roles: ['social_media_manager'], tenant: 10 })
const primaryAdminUser = buildUser({
  id: 1,
  name: 'Camila Ortega',
  email: 'camila.ortega@universidad-andina.edu',
  roles: ['unit_admin'],
})
const backupAdminUser = buildUser({
  id: 5,
  name: 'Andrés Molina',
  email: 'andres.molina@universidad-andina.edu',
  roles: ['unit_admin'],
})

const runAfterChange = (
  payload: FakePayload,
  doc: SocialMedia,
  operation: 'create' | 'update' = 'update',
  user: User | null = centralAdmin,
) =>
  afterChangeHook({
    collection,
    context: {},
    doc,
    operation,
    previousDoc: doc,
    req: createFakeRequest({ user, payload }).asRequest(),
  })

describe('SocialMedias afterChange hook (shared credential tasks)', () => {
  let payload: FakePayload

  beforeEach(() => {
    payload = createFakePayload()
    payload.create.mockImplementation(async ({ collection: slug }) =>
      slug === 'compliance_tasks'
        ? buildComplianceTask({ id: 900, type: 'CONFIRM_SHARED_PASSWORD' })
        : { id: 1 },
    )
  })

  const auditActions = () =>
    payload.create.mock.calls
      .filter(([args]) => args.collection === 'audit_log')
      .map(([args]) => args.data.action)

  it('should do nothing when the account is not a shared credential', async () => {
    await runAfterChange(payload, buildSocialMedia({ isSharedCredential: false }))

    expect(payload.find).not.toHaveBeenCalled()
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should create a shared password task for every manager and admin without one', async () => {
    payload.find.mockResolvedValueOnce({ docs: [], totalDocs: 0 }).mockResolvedValueOnce({
      docs: [manager, primaryAdminUser, backupAdminUser],
      totalDocs: 3,
    })

    await runAfterChange(
      payload,
      buildSocialMedia({
        isSharedCredential: true,
        socialMediaManagers: [3],
        primaryAdmin: 1,
        backupAdmin: 5,
      }),
    )

    expect(payload.find).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        collection: 'compliance_tasks',
        where: {
          and: [
            { assignedUser: { in: [3, 1, 5] } },
            { type: { equals: 'CONFIRM_SHARED_PASSWORD' } },
            { status: { in: ['PENDING', 'OVERDUE'] } },
          ],
        },
      }),
    )
    const taskCalls = payload.create.mock.calls.filter(
      ([args]) => args.collection === 'compliance_tasks',
    )
    expect(taskCalls.map(([args]) => args.data.assignedUser)).toEqual([3, 1, 5])
    expect(taskCalls[0][0].data).toMatchObject({
      type: 'CONFIRM_SHARED_PASSWORD',
      status: 'PENDING',
      tenant: 10,
      remindersSent: [],
      escalations: [],
    })
  })

  it('should set the task due date 30 days from now', async () => {
    payload.find
      .mockResolvedValueOnce({ docs: [], totalDocs: 0 })
      .mockResolvedValueOnce({ docs: [manager], totalDocs: 1 })
    const before = Date.now()

    await runAfterChange(payload, buildSocialMedia({ isSharedCredential: true }))

    const taskCall = payload.create.mock.calls.find(
      ([args]) => args.collection === 'compliance_tasks',
    )
    const dueMs = new Date(String(taskCall?.[0].data.dueDate)).getTime()
    const thirtyDays = 30 * 24 * 60 * 60 * 1000
    expect(dueMs - before).toBeGreaterThanOrEqual(thirtyDays - 3_600_000)
    expect(dueMs - before).toBeLessThanOrEqual(thirtyDays + 3_600_000 + 5_000)
  })

  it('should not look up the backup admin when it was cleared to null', async () => {
    payload.find
      .mockResolvedValueOnce({ docs: [], totalDocs: 0 })
      .mockResolvedValueOnce({ docs: [manager, primaryAdminUser], totalDocs: 2 })

    await runAfterChange(
      payload,
      buildSocialMedia({
        isSharedCredential: true,
        socialMediaManagers: [3],
        primaryAdmin: 1,
        backupAdmin: null,
      }),
    )

    expect(payload.find).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          and: expect.arrayContaining([{ assignedUser: { in: [3, 1] } }]),
        }),
      }),
    )
    expect(payload.find).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ collection: 'users', where: { id: { in: [3, 1] } } }),
    )
  })

  it('should resolve populated manager and admin objects to their ids', async () => {
    payload.find.mockResolvedValue({ docs: [], totalDocs: 0 })

    await runAfterChange(
      payload,
      buildSocialMedia({
        isSharedCredential: true,
        socialMediaManagers: [manager],
        primaryAdmin: primaryAdminUser,
        backupAdmin: backupAdminUser,
      }),
    )

    expect(payload.find).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          and: expect.arrayContaining([{ assignedUser: { in: [3, 1, 5] } }]),
        }),
      }),
    )
  })

  it('should skip users who already have an open shared password task', async () => {
    payload.find
      .mockResolvedValueOnce({
        docs: [
          buildComplianceTask({ assignedUser: 3 }),
          buildComplianceTask({ id: 2, assignedUser: primaryAdminUser }),
        ],
        totalDocs: 2,
      })
      .mockResolvedValueOnce({ docs: [backupAdminUser], totalDocs: 1 })

    await runAfterChange(
      payload,
      buildSocialMedia({
        isSharedCredential: true,
        socialMediaManagers: [3],
        primaryAdmin: 1,
        backupAdmin: 5,
      }),
    )

    expect(payload.find).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ collection: 'users', where: { id: { in: [5] } } }),
    )
    const taskCalls = payload.create.mock.calls.filter(
      ([args]) => args.collection === 'compliance_tasks',
    )
    expect(taskCalls).toHaveLength(1)
  })

  it('should not create anything when everyone already has an open task', async () => {
    payload.find.mockResolvedValueOnce({
      docs: [buildComplianceTask({ assignedUser: 3 }), buildComplianceTask({ assignedUser: 1 })],
      totalDocs: 2,
    })

    await runAfterChange(payload, buildSocialMedia({ isSharedCredential: true }))

    expect(payload.find).toHaveBeenCalledTimes(1)
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should return early when the account has no managers or admins', async () => {
    await runAfterChange(
      payload,
      buildSocialMedia({
        isSharedCredential: true,
        socialMediaManagers: [],
        primaryAdmin: 0,
        backupAdmin: null,
      }),
    )

    expect(payload.find).not.toHaveBeenCalled()
  })

  it('should not create tasks for users without a tenant', async () => {
    payload.find
      .mockResolvedValueOnce({ docs: [], totalDocs: 0 })
      .mockResolvedValueOnce({ docs: [buildUser({ id: 3, tenant: null })], totalDocs: 1 })

    await runAfterChange(payload, buildSocialMedia({ isSharedCredential: true }))

    expect(payload.create).not.toHaveBeenCalled()
  })

  it('should email the assignee and log the sent email in the audit log', async () => {
    payload.find
      .mockResolvedValueOnce({ docs: [], totalDocs: 0 })
      .mockResolvedValueOnce({ docs: [manager], totalDocs: 1 })

    await runAfterChange(payload, buildSocialMedia({ isSharedCredential: true }))

    expect(payload.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: manager.email }))
    const auditCall = payload.create.mock.calls.find(([args]) => args.collection === 'audit_log')
    expect(auditCall?.[0].data).toMatchObject({
      user: 3,
      action: 'email_sent',
      entity: 'compliance_tasks',
      tenant: 10,
      metadata: {
        taskId: 900,
        taskType: 'CONFIRM_SHARED_PASSWORD',
        emailType: 'task_created',
        recipient: manager.email,
        success: true,
      },
    })
  })

  it('should log an email_failed audit entry when sending the email fails', async () => {
    payload.find
      .mockResolvedValueOnce({ docs: [], totalDocs: 0 })
      .mockResolvedValueOnce({ docs: [manager], totalDocs: 1 })
    payload.sendEmail.mockRejectedValue(new Error('Resend quota exceeded'))

    await runAfterChange(payload, buildSocialMedia({ isSharedCredential: true }))

    expect(auditActions()).toEqual(['email_failed'])
    const auditCall = payload.create.mock.calls.find(([args]) => args.collection === 'audit_log')
    expect(auditCall?.[0].data.metadata).toMatchObject({
      success: false,
      error: 'Resend quota exceeded',
    })
  })

  it('should keep the task but skip the email when the user has no email address', async () => {
    payload.find
      .mockResolvedValueOnce({ docs: [], totalDocs: 0 })
      .mockResolvedValueOnce({ docs: [buildUser({ id: 3, email: '' })], totalDocs: 1 })

    await runAfterChange(payload, buildSocialMedia({ isSharedCredential: true }))

    expect(payload.sendEmail).not.toHaveBeenCalled()
    expect(auditActions()).toEqual([])
    expect(payload.create).toHaveBeenCalledTimes(1)
  })

  it('should use the populated tenant id on audit entries', async () => {
    payload.find
      .mockResolvedValueOnce({ docs: [], totalDocs: 0 })
      .mockResolvedValueOnce({ docs: [manager], totalDocs: 1 })

    await runAfterChange(
      payload,
      buildSocialMedia({
        isSharedCredential: true,
        tenant: {
          id: 10,
          name: 'Universidad Andina',
          domain: 'universidad-andina.edu',
          adminContactName: 'Camila Ortega',
          adminContactEmail: 'camila.ortega@universidad-andina.edu',
          status: 'active',
          createdAt: '2026-09-01T14:30:00.000Z',
          updatedAt: '2026-09-01T14:30:00.000Z',
        },
      }),
    )

    const auditCall = payload.create.mock.calls.find(([args]) => args.collection === 'audit_log')
    expect(auditCall?.[0].data.tenant).toBe(10)
  })

  it('should record a task_creation_failed audit entry when some tasks cannot be created', async () => {
    payload.find
      .mockResolvedValueOnce({ docs: [], totalDocs: 0 })
      .mockResolvedValueOnce({ docs: [manager, primaryAdminUser], totalDocs: 2 })
    payload.create.mockImplementation(async ({ collection: slug, data }) => {
      if (slug === 'compliance_tasks' && data.assignedUser === 1) {
        throw new Error('Database connection lost')
      }
      return slug === 'compliance_tasks' ? buildComplianceTask({ id: 900 }) : { id: 1 }
    })

    await runAfterChange(payload, buildSocialMedia({ id: 7, isSharedCredential: true }))

    const failure = payload.create.mock.calls.find(
      ([args]) => args.collection === 'audit_log' && args.data.action === 'task_creation_failed',
    )
    expect(failure?.[0].data).toMatchObject({
      user: 2,
      entity: 'social-medias',
      metadata: {
        socialMediaId: 7,
        socialMediaName: 'Universidad Andina Oficial',
        totalUsers: 2,
        failedCount: 1,
        errors: ['Database connection lost'],
      },
    })
  })

  it('should not write a task_creation_failed entry when the request has no user', async () => {
    payload.find
      .mockResolvedValueOnce({ docs: [], totalDocs: 0 })
      .mockResolvedValueOnce({ docs: [manager], totalDocs: 1 })
    payload.create.mockRejectedValue(new Error('Database connection lost'))

    await runAfterChange(payload, buildSocialMedia({ isSharedCredential: true }), 'update', null)

    expect(auditActions()).toEqual([])
  })

  it('should log a critical_error audit entry instead of throwing when a lookup fails', async () => {
    payload.find.mockRejectedValue(new Error('Query timeout'))

    await expect(
      runAfterChange(payload, buildSocialMedia({ id: 7, isSharedCredential: true })),
    ).resolves.toBeUndefined()

    const critical = payload.create.mock.calls.find(([args]) => args.collection === 'audit_log')
    expect(critical?.[0].data).toMatchObject({
      user: 2,
      action: 'critical_error',
      entity: 'social-medias',
      tenant: 10,
      metadata: {
        socialMediaId: 7,
        error: 'Query timeout',
        context: 'shared_password_task_creation',
      },
    })
  })

  it('should swallow lookup failures silently when the request has no user', async () => {
    payload.find.mockRejectedValue(new Error('Query timeout'))

    await expect(
      runAfterChange(payload, buildSocialMedia({ isSharedCredential: true }), 'create', null),
    ).resolves.toBeUndefined()

    expect(payload.create).not.toHaveBeenCalled()
  })
})

describe('SocialMedias beforeChange hook', () => {
  let payload: FakePayload

  beforeEach(() => {
    payload = createFakePayload()
  })

  const runBeforeChange = (
    data: Partial<SocialMedia>,
    operation: 'create' | 'update',
    user: User | null,
    originalDoc?: SocialMedia,
  ) =>
    beforeChangeHook({
      collection,
      context: {},
      data,
      operation,
      originalDoc,
      req: createFakeRequest({ user, payload }).asRequest(),
    })

  it.each<SocialMedia['platform']>(['tiktok', 'twitter'])(
    'should mark %s accounts as shared credentials on create',
    async (platform) => {
      const result = await runBeforeChange({ platform }, 'create', centralAdmin)

      expect(result).toMatchObject({ isSharedCredential: true })
    },
  )

  it('should leave instagram accounts as non-shared on create', async () => {
    const result = await runBeforeChange({ platform: 'instagram' }, 'create', centralAdmin)

    expect(result).toMatchObject({ isSharedCredential: false })
  })

  it('should override an explicit false for shared platforms on create', async () => {
    const result = await runBeforeChange(
      { platform: 'twitter', isSharedCredential: false },
      'create',
      centralAdmin,
    )

    expect(result).toMatchObject({ isSharedCredential: true })
  })

  it('should keep an explicit true for non-shared platforms on create', async () => {
    const result = await runBeforeChange(
      { platform: 'instagram', isSharedCredential: true },
      'create',
      centralAdmin,
    )

    expect(result).toMatchObject({ isSharedCredential: true })
  })

  it('should not touch isSharedCredential on update', async () => {
    const result = await runBeforeChange({ platform: 'twitter' }, 'update', centralAdmin)

    expect(result).not.toHaveProperty('isSharedCredential')
  })

  it('should reject changing the tenant on update', async () => {
    await expect(
      runBeforeChange({ tenant: 11 }, 'update', centralAdmin, buildSocialMedia({ tenant: 10 })),
    ).rejects.toThrow('Cannot change tenant assignment after social media creation')
  })

  it('should accept an unchanged tenant on update, populated or not', async () => {
    const result = await runBeforeChange(
      { tenant: 10 },
      'update',
      centralAdmin,
      buildSocialMedia({
        tenant: {
          id: 10,
          name: 'Universidad Andina',
          domain: 'universidad-andina.edu',
          adminContactName: 'Camila Ortega',
          adminContactEmail: 'camila.ortega@universidad-andina.edu',
          status: 'active',
          createdAt: '2026-09-01T14:30:00.000Z',
          updatedAt: '2026-09-01T14:30:00.000Z',
        },
      }),
    )

    expect(result).toMatchObject({ tenant: 10 })
  })

  it('should reject an organization that belongs to another tenant', async () => {
    payload.findByID.mockResolvedValue(buildOrganization({ id: 100, tenant: 11 }))

    await expect(
      runBeforeChange({ organization: 100, tenant: 10 }, 'create', centralAdmin),
    ).rejects.toThrow('Organization must belong to the same tenant')
    expect(payload.findByID).toHaveBeenCalledWith({ collection: 'organization', id: 100 })
  })

  it('should accept an organization from the same tenant given as a populated object', async () => {
    const organization = buildOrganization({ id: 100, tenant: 10 })
    payload.findByID.mockResolvedValue(organization)

    const result = await runBeforeChange({ organization, tenant: 10 }, 'update', centralAdmin)

    expect(payload.findByID).toHaveBeenCalledWith({ collection: 'organization', id: 100 })
    expect(result).toMatchObject({ tenant: 10 })
  })

  it('should skip the organization check when the organization cannot be found', async () => {
    payload.findByID.mockResolvedValue(null)

    await expect(
      runBeforeChange({ organization: 999, tenant: 10 }, 'update', centralAdmin),
    ).resolves.toMatchObject({ organization: 999 })
  })

  it('should not look up the organization when no tenant is provided', async () => {
    await runBeforeChange({ organization: 100 }, 'update', centralAdmin)

    expect(payload.findByID).not.toHaveBeenCalled()
  })

  it('should force pending approval when a social media manager creates an account', async () => {
    const result = await runBeforeChange({ status: 'active' }, 'create', manager)

    expect(result).toMatchObject({ status: 'pending_approval' })
  })

  it('should set pending approval when a manager creates an account without a status', async () => {
    const result = await runBeforeChange({}, 'create', manager)

    expect(result).toMatchObject({ status: 'pending_approval' })
  })

  it('should keep the requested status when a central admin creates an account', async () => {
    const result = await runBeforeChange({ status: 'active' }, 'create', centralAdmin)

    expect(result).toMatchObject({ status: 'active' })
  })

  it('should not override the status when a manager updates an account', async () => {
    const result = await runBeforeChange({ status: 'active' }, 'update', manager)

    expect(result).toMatchObject({ status: 'active' })
  })

  it('should keep a null backup admin untouched so the clearing reaches the database', async () => {
    const result = await runBeforeChange(
      { backupAdmin: null, primaryAdmin: 1 },
      'update',
      centralAdmin,
      buildSocialMedia({ backupAdmin: 5 }),
    )

    expect(result).toHaveProperty('backupAdmin', null)
  })
})
