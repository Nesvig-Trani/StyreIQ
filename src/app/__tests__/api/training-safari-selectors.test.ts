import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  BUNDLE,
  listCourses,
  TRAININGS_DIR,
  UNSAFE_SELECTORS,
} from '../../../../scripts/training-safari-selectors.mjs'

// GIQ-89: these `:has()` rules crash the tab on Safari 17.4.x. They live in the Arc modal styles
// bundled with every Rise export; `scripts/patch-training-safari.mjs` disables them.
describe('training bundles for Safari 17.4.x (GIQ-89)', () => {
  it.each(listCourses())('%s has no :has() rule known to crash Safari 17.4.x', (course) => {
    const file = path.join(TRAININGS_DIR, course, BUNDLE)
    expect(
      fs.existsSync(file),
      `${BUNDLE} is missing; if the course was re-exported, update BUNDLE in ` +
        'scripts/training-safari-selectors.mjs and run scripts/patch-training-safari.mjs',
    ).toBe(true)

    const bundle = fs.readFileSync(file, 'utf8')
    for (const selector of UNSAFE_SELECTORS) {
      expect(bundle, selector).not.toContain(selector)
    }
  })
})
