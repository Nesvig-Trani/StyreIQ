import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SkipToMainContent } from '../index'

describe('SkipToMainContent (WCAG 2.4.1)', () => {
  it('should link to the main content landmark', () => {
    render(<SkipToMainContent />)
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main-content',
    )
  })
})
