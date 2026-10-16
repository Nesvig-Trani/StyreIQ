import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EndpointError } from '@/shared'
import { changeStatusSocialMedia, createSocialMedia, updateSocialMedia } from '@/sdk/social-medias'
import { getLatestPost } from '../../sdk/get-latest-post.sdk'
import { getSavedLatestPost } from '../../sdk/get-saved-latest-post.sdk'
import { SocialMediaStatusEnum } from '../../schemas'

const fetchMock = vi.fn()

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const formData = {
  name: 'Universidad Andina Oficial',
  profileUrl: 'https://www.instagram.com/uandina_oficial',
  platform: 'instagram',
  creationDate: '2024-03-15',
  organization: '100',
  primaryAdmin: '1',
  backupAdmin: '',
  adminContactEmails: ['comunicaciones@universidad-andina.edu'],
  thirdPartyManagement: 'no_managed_internally',
  passwordManagementPractice: 'password_manager_shared',
  socialMediaManagers: ['3'],
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

describe('createSocialMedia sdk', () => {
  it('should POST the form data and return the created account', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 12 }, 201))

    const result = await createSocialMedia(formData)

    expect(result).toEqual({ id: 12 })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://app.styreiq.test/api/social-medias')
    expect(init.method).toBe('POST')
    expect(init.credentials).toBe('include')
    expect(JSON.parse(init.body)).toMatchObject({ name: 'Universidad Andina Oficial' })
  })

  it('should surface the API error message and status as an EndpointError', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'Unit selected is not valid.' }, 409))

    const failure = await createSocialMedia(formData).catch((error: unknown) => error)

    expect(failure).toBeInstanceOf(EndpointError)
    expect(failure).toMatchObject({ message: 'Unit selected is not valid.', code: 409 })
  })

  it('should throw a generic error when the API gives no error message', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 500))

    await expect(createSocialMedia(formData)).rejects.toThrow('Failed to create a social media')
  })
})

describe('updateSocialMedia sdk', () => {
  it('should PATCH the account and send an empty backup admin so it can be cleared', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 7 }))

    await updateSocialMedia({ ...formData, id: 7 })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://app.styreiq.test/api/social-medias/7')
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body)).toMatchObject({ id: 7, backupAdmin: '' })
  })

  it('should surface the API error as an EndpointError', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: 'Cannot access social media from different tenant' }, 403),
    )

    await expect(updateSocialMedia({ ...formData, id: 7 })).rejects.toMatchObject({
      message: 'Cannot access social media from different tenant',
      code: 403,
    })
  })

  it('should throw a generic error when the API gives no error message', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 500))

    await expect(updateSocialMedia({ ...formData, id: 7 })).rejects.toThrow(
      'Failed to update a social media',
    )
  })
})

describe('changeStatusSocialMedia sdk', () => {
  it('should PATCH the status endpoint with the deactivation reason', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Status updated successfully' }))

    const result = await changeStatusSocialMedia(
      7,
      SocialMediaStatusEnum.Inactive,
      'Cuenta duplicada',
    )

    expect(result).toEqual({ message: 'Status updated successfully' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://app.styreiq.test/api/social-medias/status/7')
    expect(JSON.parse(init.body)).toEqual({
      status: 'inactive',
      deactivationReason: 'Cuenta duplicada',
    })
  })

  it('should surface API errors as EndpointError', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'Status is not valid.' }, 400))

    await expect(changeStatusSocialMedia(7, SocialMediaStatusEnum.Active)).rejects.toMatchObject({
      message: 'Status is not valid.',
      code: 400,
    })
  })

  it('should throw a generic error when the API gives no error message', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 500))

    await expect(changeStatusSocialMedia(7, SocialMediaStatusEnum.Active)).rejects.toThrow(
      'Failed to approve a social media',
    )
  })
})

describe('latest post sdks', () => {
  it('should request the scraped latest post with channel, platform and account id', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }))

    await getLatestPost({ channel: 'uandina_oficial', platform: 'twitter', socialMediaId: 7 })

    const url = new URL(fetchMock.mock.calls[0][0])
    expect(url.pathname).toBe('/api/social-medias/latest-post')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      channel: 'uandina_oficial',
      platform: 'twitter',
      socialMediaId: '7',
    })
  })

  it('should throw when the latest post cannot be fetched', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 404))

    await expect(
      getLatestPost({ channel: 'uandina_oficial', platform: 'twitter', socialMediaId: 7 }),
    ).rejects.toThrow('Failed to fetch the latest post')
  })

  it('should request the saved latest post for the account', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: null }))

    const result = await getSavedLatestPost({ socialMediaId: 7 })

    expect(result).toEqual({ success: true, data: null })
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://app.styreiq.test/api/social-medias/saved-latest-post?socialMediaId=7',
    )
  })

  it('should throw when the saved latest post cannot be fetched', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 404))

    await expect(getSavedLatestPost({ socialMediaId: 7 })).rejects.toThrow(
      'Failed to fetch the saved latest post',
    )
  })
})
