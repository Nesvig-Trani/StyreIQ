import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Footer } from '../components/footer'

const IUBENDA_SRC = 'https://embeds.iubenda.com/widgets/90e807c6-0330-4bac-8f10-32cf1c362c8e.js'

describe('Footer', () => {
  it('should show contact and legal links', () => {
    render(<Footer showGetStarted={false} />)
    expect(screen.getByRole('link', { name: 'Send email to StyreIQ' })).toHaveAttribute(
      'href',
      'mailto:info@styreiq.com',
    )
    expect(screen.getByRole('link', { name: 'Terms and Conditions of Sale' })).toHaveAttribute(
      'href',
      '/terms-and-conditions',
    )
    expect(screen.getByRole('link', { name: /Privacy Policy/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cookie Preferences' })).toBeInTheDocument()
  })

  it('should load the cookie consent widget once while mounted', () => {
    const first = render(<Footer showGetStarted={false} />)
    const second = render(<Footer showGetStarted={false} />)
    expect(document.querySelectorAll(`script[src="${IUBENDA_SRC}"]`)).toHaveLength(1)
    first.unmount()
    second.unmount()
  })

  it('should remove the widget script and leftovers when leaving the landing page', () => {
    const leftover = document.createElement('div')
    leftover.className = 'iubenda-cs-container'
    document.body.appendChild(leftover)

    const { unmount } = render(<Footer showGetStarted={false} />)
    expect(document.getElementById('iubenda-script')).not.toBeNull()

    unmount()

    expect(document.getElementById('iubenda-script')).toBeNull()
    expect(document.querySelector('.iubenda-cs-container')).toBeNull()
  })
})
