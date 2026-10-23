import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

// GIQ-89: these `:has()` rules crash the tab on Safari 17.4.x. They live in the Arc modal styles
// bundled with every Rise export; `scripts/patch-training-safari.mjs` disables them.
const COURSES = ['governance-essentials', 'leadership-guide', 'risk-mitigation']
const BUNDLE = path.join('lib', 'rise', '6df44b14.js')

const UNSAFE_SELECTORS = [
  '&:not(:has([arc-modal-footer])):has([arc-modal-header]) {',
  '&:has([arc-modal-header]) {',
  '&:has([arc-modal-footer]) {',
  '&:has([arc-modal-go-back]) {',
  '&:has([arc-modal-body][data-padding=none]) {',
  '&:not([is-top-layer]):has([arc-modal][is-confirm][open])::after {',
]

describe('training bundles for Safari 17.4.x (GIQ-89)', () => {
  it.each(COURSES)('%s has no :has() rule known to crash Safari 17.4.x', (course) => {
    const bundle = fs.readFileSync(
      path.join(process.cwd(), 'private', 'trainings', course, BUNDLE),
      'utf8',
    )

    for (const selector of UNSAFE_SELECTORS) {
      expect(bundle, selector).not.toContain(selector)
    }
  })
})
