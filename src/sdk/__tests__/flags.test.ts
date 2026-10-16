import { describe, expect, it } from 'vitest'
import {
  createComment,
  createFlag,
  getComments,
  getFlagHistory,
  markFlagAsResolved,
} from '../flags'
import { FlagTypeEnum } from '@/features/flags/schemas'
import { BASE_URL, jsonResponse, setupFetchMock } from './sdk-fetch'

const { fetchMock, lastCall } = setupFetchMock()

describe('createFlag', () => {
  const flag = {
    flagType: FlagTypeEnum.MISSING_2FA,
    affectedEntity: '55',
    description: 'La cuenta institucional no tiene doble factor.',
    suggestedAction: 'Activar 2FA',
    assignedTo: '12',
    dueDate: '2026-11-15',
    tenant: 10,
  }

  it('should post the flag fields', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 1 }))
    await expect(createFlag(flag)).resolves.toEqual({ id: 1 })
    expect(lastCall().url).toBe(`${BASE_URL}/api/flags`)
    expect(lastCall().body).toMatchObject({ flagType: 'missing_2fa', assignedTo: '12', tenant: 10 })
  })

  it('should throw when creation fails', async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, {}))
    await expect(createFlag(flag)).rejects.toThrow('Failed to create flag')
  })
})

describe('markFlagAsResolved', () => {
  it('should put to the resolved endpoint', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }))
    await markFlagAsResolved(4)
    expect(lastCall().url).toBe(`${BASE_URL}/api/flags/resolved/4`)
    expect(lastCall().init.method).toBe('PUT')
  })

  it('should throw when the status could not be updated', async () => {
    fetchMock.mockResolvedValue(jsonResponse(403, {}))
    await expect(markFlagAsResolved(4)).rejects.toThrow('Failed to update flag status')
  })
})

describe('flag history and comments', () => {
  it('should query the history of a flag ordered by creation date', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { docs: [] }))
    await getFlagHistory(4)
    expect(lastCall().url).toBe(`${BASE_URL}/api/flagHistory?where[flag][equals]=4&sort=createdAt`)
  })

  it('should throw when the history cannot be loaded', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, {}))
    await expect(getFlagHistory(4)).rejects.toThrow('Failed to get flag history')
  })

  it('should query the comments of a flag', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { docs: [] }))
    await getComments(4)
    expect(lastCall().url).toBe(`${BASE_URL}/api/flagComments?where[flag][equals]=4&sort=createdAt`)
  })

  it('should throw when comments cannot be loaded', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, {}))
    await expect(getComments(4)).rejects.toThrow('Failed to get flag history')
  })

  it('should post a new comment', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 8 }))
    await createComment({ flagId: 4, comment: 'Se contactó al administrador.' })
    expect(lastCall().body).toEqual({ flagId: 4, comment: 'Se contactó al administrador.' })
  })

  it('should throw when the comment cannot be saved', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, {}))
    await expect(createComment({ flagId: 4, comment: 'x' })).rejects.toThrow()
  })
})
