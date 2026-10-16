import { describe, expect, it } from 'vitest'
import {
  completeComplianceTask,
  completeFlagResolutionTask,
  completePasswordSetupTask,
  completeRollCallTask,
  completeSharedPasswordTask,
  completeTrainingTask,
  completeTwoFactorTask,
  completeUserPasswordTask,
  generateRollCallForUser,
  getRollCallStatus,
} from '../compliance-task'
import { BASE_URL, htmlResponse, jsonResponse, setupFetchMock } from './sdk-fetch'

const { fetchMock, lastCall } = setupFetchMock()

describe('single-purpose task completion endpoints', () => {
  it.each([
    ['completePasswordSetupTask', completePasswordSetupTask, 'complete-password-setup'],
    ['completeTrainingTask', completeTrainingTask, 'complete-training'],
    ['completeRollCallTask', completeRollCallTask, 'complete-roll-call'],
    ['completeUserPasswordTask', completeUserPasswordTask, 'complete-user-password'],
    ['completeSharedPasswordTask', completeSharedPasswordTask, 'complete-shared-password'],
    ['completeTwoFactorTask', completeTwoFactorTask, 'complete-2fa'],
  ])('%s should patch the matching endpoint', async (_name, complete, endpoint) => {
    fetchMock.mockResolvedValue(jsonResponse(200, { status: 'COMPLETED' }))
    await expect(complete(42)).resolves.toEqual({ status: 'COMPLETED' })
    expect(lastCall().url).toBe(`${BASE_URL}/api/compliance_tasks/42/${endpoint}`)
    expect(lastCall().init.method).toBe('PATCH')
  })

  it('should throw the endpoint error message when completion is rejected', async () => {
    fetchMock.mockResolvedValue(jsonResponse(403, { error: 'This task belongs to another user' }))
    await expect(completeTrainingTask(42)).rejects.toThrow('This task belongs to another user')
  })

  it('should throw the endpoint-specific fallback when the body is not JSON', async () => {
    fetchMock.mockResolvedValue(htmlResponse(502))
    await expect(completeTwoFactorTask(42)).rejects.toThrow('Failed to complete 2FA confirmation')
  })
})

describe('completeComplianceTask', () => {
  it('should send the notes', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }))
    await completeComplianceTask(7, 'Política revisada con el equipo')
    expect(lastCall().url).toBe(`${BASE_URL}/api/compliance_tasks/7/complete`)
    expect(lastCall().body).toEqual({ notes: 'Política revisada con el equipo' })
  })

  it('should send empty notes when none are given', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }))
    await completeComplianceTask(7)
    expect(lastCall().body).toEqual({ notes: '' })
  })

  it('should throw the fallback when the task cannot be completed', async () => {
    fetchMock.mockResolvedValue(htmlResponse(500))
    await expect(completeComplianceTask(7)).rejects.toThrow('Failed to complete task')
  })
})

describe('completeFlagResolutionTask', () => {
  it('should send the resolution summary', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }))
    await completeFlagResolutionTask(9, 'Se activó el doble factor')
    expect(lastCall().url).toBe(`${BASE_URL}/api/compliance_tasks/9/complete-flag-resolution`)
    expect(lastCall().body).toEqual({ resolutionSummary: 'Se activó el doble factor' })
  })

  it('should throw the server error message', async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { error: 'Summary is required' }))
    await expect(completeFlagResolutionTask(9, '')).rejects.toThrow('Summary is required')
  })
})

describe('roll call actions', () => {
  it('should request a roll call for a user in a tenant', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { taskId: 3 }))
    await expect(generateRollCallForUser(12, 10)).resolves.toEqual({ taskId: 3 })
    expect(lastCall().url).toBe(`${BASE_URL}/api/compliance_tasks/generate-roll-call`)
    expect(lastCall().body).toEqual({ userId: 12, tenantId: 10 })
  })

  it('should throw the fallback when the roll call cannot be generated', async () => {
    fetchMock.mockResolvedValue(htmlResponse(500))
    await expect(generateRollCallForUser(12, 10)).rejects.toThrow('Failed to generate Roll Call')
  })

  it('should query the roll call status of several users', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { 12: 'PENDING' }))
    await getRollCallStatus([12, 14])
    expect(lastCall().url).toBe(`${BASE_URL}/api/compliance_tasks/roll-call-status`)
    expect(lastCall().body).toEqual({ userIds: [12, 14] })
  })

  it('should throw the server error when the status lookup fails', async () => {
    fetchMock.mockResolvedValue(jsonResponse(403, { error: 'Forbidden' }))
    await expect(getRollCallStatus([12])).rejects.toThrow('Forbidden')
  })
})
