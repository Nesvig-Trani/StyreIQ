import { describe, expect, it } from 'vitest'
import { changeStatusSocialMedia, createSocialMedia, updateSocialMedia } from '../social-medias'
import { SocialMediaStatusEnum } from '@/features/social-medias'
import { EndpointError } from '@/shared'
import { BASE_URL, jsonResponse, setupFetchMock } from './sdk-fetch'

const { fetchMock, lastCall } = setupFetchMock()

const account = {
  name: 'Universidad Andina Oficial',
  profileUrl: 'https://instagram.com/universidadandina',
  platform: 'instagram',
  creationDate: '2021-03-15',
  organization: '100',
  primaryAdmin: '12',
  adminContactEmails: ['comunicaciones@universidad-andina.edu'],
  thirdPartyManagement: 'no',
  passwordManagementPractice: 'password_manager',
  socialMediaManagers: ['12'],
  contactEmail: 'comunicaciones@universidad-andina.edu',
  contactPhone: '+573001234567',
}

describe('createSocialMedia', () => {
  it('should post the account and return the created record', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 55 }))
    await expect(createSocialMedia(account)).resolves.toEqual({ id: 55 })
    expect(lastCall().url).toBe(`${BASE_URL}/api/social-medias`)
    expect(lastCall().body).toMatchObject({
      name: 'Universidad Andina Oficial',
      platform: 'instagram',
    })
  })

  it('should raise an EndpointError when the endpoint reports an error', async () => {
    fetchMock.mockResolvedValue(jsonResponse(409, { error: 'Account already registered' }))
    const failure = await createSocialMedia(account).catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(EndpointError)
    expect(failure).toMatchObject({ message: 'Account already registered', code: 409 })
  })

  it('should raise a generic error when the endpoint gives no reason', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, {}))
    await expect(createSocialMedia(account)).rejects.toThrow('Failed to create a social media')
  })
})

describe('updateSocialMedia', () => {
  const update = { ...account, id: 55, backupAdmin: '14' }

  it('should patch the account by id', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: 55 }))
    await updateSocialMedia(update)
    expect(lastCall().url).toBe(`${BASE_URL}/api/social-medias/55`)
    expect(lastCall().init.method).toBe('PATCH')
    expect(lastCall().body.backupAdmin).toBe('14')
  })

  it('should raise an EndpointError when the endpoint reports an error', async () => {
    fetchMock.mockResolvedValue(jsonResponse(403, { error: 'Not your account' }))
    await expect(updateSocialMedia(update)).rejects.toMatchObject({
      message: 'Not your account',
      code: 403,
    })
  })

  it('should raise a generic error when the endpoint gives no reason', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, {}))
    await expect(updateSocialMedia(update)).rejects.toThrow('Failed to update a social media')
  })
})

describe('changeStatusSocialMedia', () => {
  it('should send the new status and deactivation reason', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { status: 'inactive' }))
    await changeStatusSocialMedia(55, SocialMediaStatusEnum.Inactive, 'Cuenta cerrada')
    expect(lastCall().url).toBe(`${BASE_URL}/api/social-medias/status/55`)
    expect(lastCall().body).toEqual({ status: 'inactive', deactivationReason: 'Cuenta cerrada' })
  })

  it('should raise an EndpointError or a generic error on failure', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(403, { error: 'Only admins can change status' }))
    await expect(changeStatusSocialMedia(55, SocialMediaStatusEnum.Active)).rejects.toMatchObject({
      code: 403,
    })
    fetchMock.mockResolvedValueOnce(jsonResponse(500, {}))
    await expect(changeStatusSocialMedia(55, SocialMediaStatusEnum.Active)).rejects.toThrow(
      'Failed to approve a social media',
    )
  })
})
