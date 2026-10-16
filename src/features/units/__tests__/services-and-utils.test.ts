import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchFilteredUsers } from '@/features/units/services/getFilteredUsersFromUnit'
import { calcParentPathAndDepth } from '@/features/units/utils/calcPathAndDepth'
import { createFakePayload } from '@/shared/__tests__/payload-fakes'
import { buildOrganization, buildUser } from '@/shared/__tests__/fixtures'

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('fetchFilteredUsers', () => {
  const fetchMock = vi.fn<typeof fetch>()
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('should request the users of the selected parent organization', async () => {
    const jimena = buildUser({ id: 9, name: 'Jimena Salazar' })
    fetchMock.mockResolvedValue(jsonResponse(200, { docs: [jimena] }))
    const users = await fetchFilteredUsers('100', 'Universidad Andina')
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe(
      'https://app.styreiq.test/api/organization/filtered-users?parentOrgId=100&parentOrgName=Universidad+Andina',
    )
    expect(init).toMatchObject({ method: 'GET', credentials: 'include' })
    expect(users).toEqual([jimena])
  })

  it('should omit the empty parameters', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, {}))
    expect(await fetchFilteredUsers('')).toEqual([])
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/filtered-users\?$/)
  })

  it('should return an empty list when the API responds with an error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchMock.mockResolvedValue(jsonResponse(500, { error: 'boom' }))
    expect(await fetchFilteredUsers('100')).toEqual([])
  })

  it('should throw a friendly error when the request itself fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchMock.mockRejectedValue(new TypeError('network down'))
    await expect(fetchFilteredUsers('100')).rejects.toThrow('Error fetching filtered users')
  })
})

describe('calcParentPathAndDepth', () => {
  it('should return the root path and depth when there is no parent', async () => {
    const payload = createFakePayload()
    const result = await calcParentPathAndDepth({
      payload: payload.asPayload(),
      parentOrg: 0,
      id: 5,
      name: 'Universidad Andina',
    })
    expect(result).toEqual({ parentDepth: 0, parentPath: '' })
    expect(payload.findByID).not.toHaveBeenCalled()
  })

  it('should inherit path and depth from the parent', async () => {
    const payload = createFakePayload()
    payload.findByID.mockResolvedValue(buildOrganization({ id: 100, path: '100', depth: 2 }))
    const result = await calcParentPathAndDepth({
      payload: payload.asPayload(),
      parentOrg: 100,
      id: 200,
      name: 'Facultad de Artes',
    })
    expect(result).toEqual({ parentDepth: 2, parentPath: '100' })
  })

  it('should fail when the parent organization is missing', async () => {
    await expect(
      calcParentPathAndDepth({
        payload: createFakePayload().asPayload(),
        parentOrg: 100,
        id: 200,
        name: 'Facultad de Artes',
      }),
    ).rejects.toThrow('Parent organization not found')
  })

  it('should refuse to create a circular hierarchy', async () => {
    const payload = createFakePayload()
    payload.findByID.mockResolvedValue(buildOrganization({ id: 200, path: '100/200' }))
    await expect(
      calcParentPathAndDepth({
        payload: payload.asPayload(),
        parentOrg: 200,
        id: 100,
        name: 'Universidad Andina',
      }),
    ).rejects.toThrow('circular hierarchy')
  })
})
