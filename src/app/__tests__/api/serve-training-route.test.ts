import { beforeEach, describe, expect, it, vi } from 'vitest'
import path from 'path'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/serve-training/[...path]/route'
import { buildUser } from '@/shared/__tests__/fixtures'

const fsFake = vi.hoisted(() => ({ existsSync: vi.fn(), readFileSync: vi.fn() }))
const verifyUser = vi.hoisted(() => vi.fn())

vi.mock('fs', () => ({ default: fsFake, ...fsFake }))
vi.mock('@/features/auth/utils/getAuthUser', () => ({ verifyUser }))

const call = (...segments: string[]) =>
  GET(new NextRequest(`https://app.styreiq.test/api/serve-training/${segments.join('/')}`), {
    params: Promise.resolve({ path: segments }),
  })

beforeEach(() => {
  fsFake.existsSync.mockReset().mockReturnValue(true)
  fsFake.readFileSync.mockReset().mockReturnValue(Buffer.from('<h1>Gobernanza</h1>'))
  verifyUser.mockReset().mockResolvedValue(buildUser())
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

describe('GET /api/serve-training/[...path]', () => {
  it('should redirect an unauthenticated visitor to login and remember the training', async () => {
    verifyUser.mockResolvedValue(null)
    const response = await call('training-governance', 'index.html')
    const location = new URL(response.headers.get('location') ?? '')
    expect(location.pathname).toBe('/login')
    expect(location.searchParams.get('redirect')).toBe('/trainings/training-governance/index.html')
    expect(fsFake.readFileSync).not.toHaveBeenCalled()
  })

  it('should serve the file from the private trainings folder with its content type', async () => {
    const response = await call('training-governance', 'index.html')
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8')
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=3600')
    expect(await response.text()).toBe('<h1>Gobernanza</h1>')
    expect(fsFake.readFileSync).toHaveBeenCalledWith(
      path.join(process.cwd(), 'private', 'trainings', 'training-governance', 'index.html'),
    )
  })

  it.each([
    ['styles.css', 'text/css'],
    ['video.mp4', 'video/mp4'],
    ['LOGO.PNG', 'image/png'],
    ['notes.xyz', 'application/octet-stream'],
  ])('should label %s as %s', async (file, contentType) => {
    const response = await call('training-risk', file)
    expect(response.headers.get('Content-Type')).toBe(contentType)
  })

  it('should answer 404 when the file does not exist', async () => {
    fsFake.existsSync.mockReturnValue(false)
    const response = await call('training-risk', 'missing.html')
    expect(response.status).toBe(404)
  })

  it('should answer 403 on path traversal attempts', async () => {
    const response = await call('..', '..', 'package.json')
    expect(response.status).toBe(403)
    expect(fsFake.readFileSync).not.toHaveBeenCalled()
  })

  it('should answer 500 when the file cannot be read', async () => {
    fsFake.readFileSync.mockImplementation(() => {
      throw new Error('EIO')
    })
    const response = await call('training-risk', 'index.html')
    expect(response.status).toBe(500)
  })
})
