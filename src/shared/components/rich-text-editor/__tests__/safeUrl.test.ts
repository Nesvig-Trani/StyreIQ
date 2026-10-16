import { describe, expect, it } from 'vitest'
import { isSafeUrl, toSafeUrl } from '../utils/safeUrl'

describe('toSafeUrl (policy editor links, GIQ-91)', () => {
  it('should prefix bare domains with https', () => {
    expect(toSafeUrl('  styreiq.com/politicas ')).toBe('https://styreiq.com/politicas')
  })

  it.each([
    'https://styreiq.com',
    'http://styreiq.com',
    'mailto:cumplimiento@styreiq.com',
    'tel:+576015551234',
  ])('should keep the allowed link %s', (url) => {
    expect(toSafeUrl(url)).toBe(url)
  })

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>1</script>',
    'ftp://files.styreiq.com',
    'vbscript:x',
  ])('should reject the unsafe scheme %s', (url) => {
    expect(toSafeUrl(url)).toBeNull()
    expect(isSafeUrl(url)).toBe(false)
  })

  it('should reject empty input', () => {
    expect(toSafeUrl('   ')).toBeNull()
  })
})
