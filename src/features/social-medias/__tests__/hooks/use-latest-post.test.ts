import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLatestPost } from '../../hooks/useLatestPost'

const fetchMock = vi.fn()
const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const savedPost = {
  id: '1840211223344',
  platform: 'twitter',
  author: 'Universidad Andina',
  content: 'Abrimos inscripciones para el semestre 2027-1',
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

describe('useLatestPost', () => {
  it('should load the saved latest post on mount', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: savedPost }))

    const { result } = renderHook(() => useLatestPost('twitter', 'uandina_oficial', 7))

    await waitFor(() => expect(result.current.latestPost).toEqual(savedPost))
    expect(result.current.success).toBe(true)
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(fetchMock.mock.calls[0][0]).toContain('/api/social-medias/saved-latest-post')
  })

  it('should report the API message when nothing has been saved yet', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: false, message: 'No saved latest post found', data: null }),
    )

    const { result } = renderHook(() => useLatestPost('twitter', 'uandina_oficial', 7))

    await waitFor(() => expect(result.current.error).toBe('No saved latest post found'))
    expect(result.current.success).toBe(false)
    expect(result.current.latestPost).toBeNull()
  })

  it('should use a default message when the API gives none', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: false, data: null }))

    const { result } = renderHook(() => useLatestPost('twitter', 'uandina_oficial', 7))

    await waitFor(() => expect(result.current.error).toBe('No saved post found'))
  })

  it('should expose the error when the saved post request fails', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 500))

    const { result } = renderHook(() => useLatestPost('twitter', 'uandina_oficial', 7))

    await waitFor(() => expect(result.current.error).toBe('Failed to fetch the saved latest post'))
  })

  it('should scrape and store the latest post on demand', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: false, message: 'none', data: null }))
    const { result } = renderHook(() => useLatestPost('twitter', 'uandina_oficial', 7))
    await waitFor(() => expect(result.current.loading).toBe(false))
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: savedPost }))

    act(() => result.current.getAndSaveLatesPost())

    await waitFor(() => expect(result.current.latestPost).toEqual(savedPost))
    expect(result.current.success).toBe(true)
    expect(result.current.error).toBeNull()
    const scrapeUrl = new URL(fetchMock.mock.calls[1][0])
    expect(scrapeUrl.pathname).toBe('/api/social-medias/latest-post')
    expect(scrapeUrl.searchParams.get('channel')).toBe('uandina_oficial')
  })

  it('should flag the failure when scraping the latest post fails', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: false, data: null }))
    const { result } = renderHook(() => useLatestPost('twitter', 'uandina_oficial', 7))
    await waitFor(() => expect(result.current.loading).toBe(false))
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 404))

    act(() => result.current.getAndSaveLatesPost())

    await waitFor(() => expect(result.current.error).toBe('Failed to fetch the latest post'))
    expect(result.current.success).toBe(false)
  })
})
