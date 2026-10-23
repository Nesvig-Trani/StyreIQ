// GIQ-89: Safari 17.4.x (WebKit) crashes the tab while loading the Articulate Rise trainings
// (`Node.appendChild` -> `invalidateForHasAfterMutation` -> `SelectorChecker::checkOne`).
// Bisected to six `:has()` rules of the Arc modal styles bundled in `lib/rise/6df44b14.js`.
// This script disables them by turning `:has(` into an unknown pseudo-class, which makes the
// browser drop each rule. Run it again after replacing a course export from Rise:
//   node scripts/patch-training-safari.mjs
import fs from 'node:fs'
import path from 'node:path'

const TRAININGS_DIR = path.join(process.cwd(), 'private', 'trainings')
const BUNDLE = path.join('lib', 'rise', '6df44b14.js')
const DISABLED_HAS = ':-giq89-disabled-has('

// Each selector must appear exactly once per bundle (6 selectors, 7 `:has(` occurrences).
const UNSAFE_SELECTORS = [
  '&:not(:has([arc-modal-footer])):has([arc-modal-header]) {',
  '&:has([arc-modal-header]) {',
  '&:has([arc-modal-footer]) {',
  '&:has([arc-modal-go-back]) {',
  '&:has([arc-modal-body][data-padding=none]) {',
  '&:not([is-top-layer]):has([arc-modal][is-confirm][open])::after {',
]

const courses = fs
  .readdirSync(TRAININGS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(TRAININGS_DIR, entry.name, BUNDLE)))
  .map((entry) => entry.name)

for (const course of courses) {
  const file = path.join(TRAININGS_DIR, course, BUNDLE)
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
