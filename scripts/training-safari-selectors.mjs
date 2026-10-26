// GIQ-89: shared by `patch-training-safari.mjs` and its test so the selector list cannot drift.
import fs from 'node:fs'
import path from 'node:path'

export const TRAININGS_DIR = path.join(process.cwd(), 'private', 'trainings')
// Rise names bundles by content hash, so a re-export will likely rename this file.
export const BUNDLE = path.join('lib', 'rise', '6df44b14.js')

// Each selector must appear exactly once per bundle (6 selectors, 7 `:has(` occurrences).
export const UNSAFE_SELECTORS = [
  '&:not(:has([arc-modal-footer])):has([arc-modal-header]) {',
  '&:has([arc-modal-header]) {',
  '&:has([arc-modal-footer]) {',
  '&:has([arc-modal-go-back]) {',
  '&:has([arc-modal-body][data-padding=none]) {',
  '&:not([is-top-layer]):has([arc-modal][is-confirm][open])::after {',
]

export const listCourses = () =>
  fs
    .readdirSync(TRAININGS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
