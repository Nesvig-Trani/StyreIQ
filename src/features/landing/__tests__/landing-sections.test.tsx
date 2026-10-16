import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Eye, Shield } from 'lucide-react'
import { FeatureSection } from '../components/feature-section'
import { ProcessSection } from '../components/process-section'
import { HeroSection } from '../components/hero-section'
import { FAQSection } from '../components/faq-section'
import { TermsSection } from '../components/terms-section'

afterEach(() =>
  document.querySelector('script[src="https://cdn.iubenda.com/iubenda.js"]')?.remove(),
)

describe('FeatureSection', () => {
  const features = [
    {
      icon: Shield,
      title: 'Stay Compliant',
      description: 'Mantenga los registros de cuentas de la Dirección de Comunicaciones.',
    },
    { icon: Eye, title: 'Be Audit Ready', description: 'Logs automáticos de cada cambio.' },
  ]

  it('should render the heading, subtitle and every feature card', () => {
    render(
      <FeatureSection
        id="benefits"
        title="Safety and Compliance"
        subtitle="Prevent costly missteps"
        features={features}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Safety and Compliance' })).toBeInTheDocument()
    expect(screen.getByText('Prevent costly missteps')).toBeInTheDocument()
    expect(screen.getByText('Stay Compliant')).toBeInTheDocument()
    expect(screen.getByText('Logs automáticos de cada cambio.')).toBeInTheDocument()
    expect(document.getElementById('benefits')).not.toBeNull()
  })

  it('should only render the optional subtitle and footer when provided', () => {
    const { container, rerender } = render(<FeatureSection title="Benefits" features={features} />)
    expect(container.querySelector('p.text-lg')).toBeNull()
    expect(screen.queryByText('Contáctenos')).not.toBeInTheDocument()

    rerender(<FeatureSection title="Benefits" features={features} footerText="Contáctenos" />)
    expect(screen.getByText('Contáctenos')).toBeInTheDocument()
  })

  it('should lay the cards out in the requested number of columns', () => {
    const { container } = render(
      <FeatureSection title="Benefits" features={features} columns={4} />,
    )
    expect(container.querySelector('.lg\\:grid-cols-4')).not.toBeNull()
  })
})

describe('ProcessSection', () => {
  const steps = [
    { number: '01', title: 'Account Registry', description: 'Todas las cuentas.', icon: Shield },
    { number: '02', title: 'Admin Assignments', description: 'Principal y respaldo.', icon: Eye },
    { number: '03', title: 'Access Tracking', description: 'Quién tiene acceso.', icon: Eye },
    { number: '04', title: 'Audit Logs', description: 'Registros integrados.', icon: Shield },
  ]

  it('should render each step with its title and description', () => {
    render(<ProcessSection id="how-it-works" title="Features" subtitle="Control" steps={steps} />)
    expect(screen.getByRole('heading', { name: 'Features' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Audit Logs', level: 3 })).toBeInTheDocument()
    expect(screen.getByText('Quién tiene acceso.')).toBeInTheDocument()
  })

  it('should centre a lone last step in the grid', () => {
    render(<ProcessSection title="Features" steps={steps} />)
    const last = screen.getByText('Audit Logs').parentElement
    expect(last).toHaveClass('md:col-start-2')
    expect(screen.getByText('Account Registry').parentElement).not.toHaveClass('md:col-start-2')
  })
})

describe('HeroSection', () => {
  it('should present the product and open the demo form from the call to action', async () => {
    render(<HeroSection />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Governance HQ')

    await userEvent.setup().click(screen.getByRole('button', { name: 'Request Demo' }))

    expect(await screen.findByRole('heading', { name: 'Request a Demo' })).toBeInTheDocument()
  })
})

describe('FAQSection', () => {
  it('should start with every answer collapsed', () => {
    render(<FAQSection />)
    const questions = screen.getAllByRole('button')
    expect(questions.length).toBeGreaterThanOrEqual(6)
    questions.forEach((question) => expect(question).toHaveAttribute('aria-expanded', 'false'))
  })

  it('should expand one answer at a time and collapse it again', async () => {
    const user = userEvent.setup()
    render(<FAQSection id="faq" />)
    const first = screen.getByRole('button', { name: /Is StyreIQ right for our organization/ })
    const second = screen.getByRole('button', { name: /Is onboarding going to be a pain/ })

    await user.click(first)
    expect(first).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/purpose-built for large, multi-unit systems/)).toBeInTheDocument()

    await user.click(second)
    expect(first).toHaveAttribute('aria-expanded', 'false')
    expect(second).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.queryByText(/purpose-built for large, multi-unit systems/),
    ).not.toBeInTheDocument()

    await user.click(second)
    expect(second).toHaveAttribute('aria-expanded', 'false')
  })

  it('should render rich answers with lists', async () => {
    render(<FAQSection />)
    await userEvent.setup().click(screen.getByRole('button', { name: /What risks does StyreIQ/ }))
    expect(screen.getByText(/The biggest threats/)).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(3)
  })

  it('should load the legal widget script only once', () => {
    render(<FAQSection />)
    render(<FAQSection />)
    expect(
      document.querySelectorAll('script[src="https://cdn.iubenda.com/iubenda.js"]'),
    ).toHaveLength(1)
  })
})

describe('TermsSection', () => {
  it('should show the terms with a link back to the landing page', () => {
    render(<TermsSection />)
    expect(
      screen.getByRole('heading', { name: 'GENERAL TERMS AND CONDITIONS OF SALE' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to Home/ })).toHaveAttribute('href', '/')
    expect(screen.getByRole('heading', { name: 'Applicability' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThan(5)
  })
})
