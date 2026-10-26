// GIQ-89: Safari 17.4.x (WebKit) crashes the tab while loading the Articulate Rise trainings
// (`Node.appendChild` -> `invalidateForHasAfterMutation` -> `SelectorChecker::checkOne`).
// Bisected to six `:has()` rules of the Arc modal styles bundled in `lib/rise/6df44b14.js`.
// This script disables them by turning `:has(` into an unknown pseudo-class, which makes the
// browser drop each rule. Run it again after replacing a course export from Rise:
//   node scripts/patch-training-safari.mjs
import fs from 'node:fs'
import path from 'node:path'
import { BUNDLE, listCourses, TRAININGS_DIR, UNSAFE_SELECTORS } from './training-safari-selectors.mjs'

const DISABLED_HAS = ':-giq89-disabled-has('

for (const course of listCourses()) {
  const file = path.join(TRAININGS_DIR, course, BUNDLE)
  if (!fs.existsSync(file)) {
    console.error(
      `${course}: ${BUNDLE} not found. If the course was re-exported, find the bundle with the ` +
        'Arc modal styles (search for "arc-modal-header"), update BUNDLE in ' +
        'scripts/training-safari-selectors.mjs and run this script again.',
    )
    process.exitCode = 1
    continue
  }

  let content = fs.readFileSync(file, 'utf8')
  let patched = 0

  for (const selector of UNSAFE_SELECTORS) {
    const disabled = selector.replaceAll(':has(', DISABLED_HAS)
    const occurrences = content.split(selector).length - 1
    if (occurrences === 0 && content.includes(disabled)) continue
    if (occurrences !== 1) {
      throw new Error(`${course}: expected 1 match for "${selector}", found ${occurrences}`)
    }
    content = content.replace(selector, () => disabled)
    patched++
  }

  if (patched > 0) fs.writeFileSync(file, content)
  console.log(`${course}: ${patched} selector(s) patched`)
}
