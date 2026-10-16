import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Navbar } from '../components/navbar'

describe('Navbar', () => {
  it('should link to the landing page sections and login', () => {
    render(<Navbar showGetStarted={false} />)
    expect(screen.getByRole('link', { name: 'Benefits' })).toHaveAttribute('href', '#benefits')
    expect(screen.getByRole('link', { name: 'How It Works' })).toHaveAttribute(
      'href',
      '#how-it-works',
    )
    expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '#faq')
    expect(screen.getByRole('link', { name: 'Log In' })).toHaveAttribute('href', '/login')
  })

  it('should offer Get Started only on a fresh installation', () => {
    const { rerender } = render(<Navbar showGetStarted={false} />)
    expect(screen.queryByRole('link', { name: 'Get Started' })).not.toBeInTheDocument()

    rerender(<Navbar showGetStarted />)
    expect(screen.getByRole('link', { name: 'Get Started' })).toHaveAttribute(
      'href',
      '/login/create-first-user',
    )
  })

  it('should open and close the mobile menu from the hamburger button', async () => {
    const user = userEvent.setup()
    render(<Navbar showGetStarted />)
    expect(document.getElementById('landing-mobile-menu')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    const menu = document.getElementById('landing-mobile-menu')
    expect(menu).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )

    await user.click(screen.getByRole('button', { name: 'Close menu' }))
    expect(document.getElementById('landing-mobile-menu')).toBeNull()
  })

  it('should close the mobile menu and return focus to the button on Escape', async () => {
    const user = userEvent.setup()
    render(<Navbar showGetStarted={false} />)
    await user.click(screen.getByRole('button', { name: 'Open menu' }))

    await user.keyboard('{Escape}')

    expect(document.getElementById('landing-mobile-menu')).toBeNull()
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveFocus()
  })

  it('should close the mobile menu after following a section link', async () => {
    const user = userEvent.setup()
    render(<Navbar showGetStarted={false} />)
    await user.click(screen.getByRole('button', { name: 'Open menu' }))

    const [, mobileFaqLink] = screen.getAllByRole('link', { name: 'FAQ' })
    await user.click(mobileFaqLink)

    expect(document.getElementById('landing-mobile-menu')).toBeNull()
  })
})
