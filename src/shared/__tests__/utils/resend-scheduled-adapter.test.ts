// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'
import { resendScheduledAdapter } from '@/shared/utils/resendScheduledAdapter'
import { createFakePayload } from '@/shared/__tests__/payload-fakes'

const fetchMock = vi.fn<typeof fetch>()
const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const adapterFor = (payload: Payload) => resendScheduledAdapter()({ payload })

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('resendScheduledAdapter', () => {
  const payload = createFakePayload().asPayload()

  it('should expose the configured sender defaults', () => {
    const adapter = adapterFor(payload)
    expect(adapter.name).toBe('resend-scheduled')
    expect(adapter.defaultFromAddress).toBe('no-reply@styreiq.test')
    expect(adapter.defaultFromName).toBe('StyreIQ')
  })

  it('should post the email to Resend with the API key and the default sender', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: 're_123' }))
    const result = await adapterFor(payload).sendEmail({
      to: 'valentina.restrepo@universidad-andina.edu',
      subject: 'Recordatorio de política',
      html: '<p>Hola Valentina</p>',
    })
    expect(result).toEqual({ id: 're_123' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.resend.com/emails')
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer re_unit_test_key' })
    expect(JSON.parse(String(init?.body))).toEqual({
      from: 'StyreIQ <no-reply@styreiq.test>',
      to: 'valentina.restrepo@universidad-andina.edu',
      cc: '',
      bcc: '',
      reply_to: '',
      subject: 'Recordatorio de política',
      html: '<p>Hola Valentina</p>',
      text: '',
    })
  })

  it('should map address objects and arrays and forward the schedule', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: 're_456' }))
    await adapterFor(payload).sendEmail({
      from: { name: 'Equipo StyreIQ', address: 'equipo@styreiq.test' },
      to: [
        'camila.ortega@universidad-andina.edu',
        { name: 'Rafael Mejía', address: 'rafael.mejia@universidad-andina.edu' },
      ],
      cc: { name: 'Jimena Salazar', address: 'jimena.salazar@universidad-andina.edu' },
      replyTo: 'soporte@styreiq.test',
      subject: 'Resumen semanal',
      text: 'Resumen',
      scheduledAt: '2026-10-20T14:00:00.000Z',
    })
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      from: 'Equipo StyreIQ <equipo@styreiq.test>',
      to: ['camila.ortega@universidad-andina.edu', 'rafael.mejia@universidad-andina.edu'],
      cc: ['jimena.salazar@universidad-andina.edu'],
      reply_to: 'soporte@styreiq.test',
      text: 'Resumen',
      scheduled_at: '2026-10-20T14:00:00.000Z',
    })
  })

  it('should raise an APIError with the Resend status and detail when sending fails', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(422, {
        statusCode: 422,
        name: 'validation_error',
        message: 'Invalid `to` field',
      }),
    )
    await expect(
      adapterFor(payload).sendEmail({ to: 'no-es-un-correo', subject: 'Hola' }),
    ).rejects.toMatchObject({
      message: 'Error sending email: 422 validation_error - Invalid `to` field',
      status: 422,
    })
  })

  it('should fall back to the HTTP status when the error body is not an object', async () => {
    fetchMock.mockResolvedValue(jsonResponse(502, 'bad gateway'))
    await expect(
      adapterFor(payload).sendEmail({
        to: 'camila.ortega@universidad-andina.edu',
        subject: 'Hola',
      }),
    ).rejects.toMatchObject({ message: 'Error sending email: 502', status: 502 })
  })
})
