---
status: implemented
ticket: GIQ-72
sprint: TBD
standard: WCAG 2.1 Level AA
linear_url: https://linear.app/meltstudio/issue/GIQ-72
git_branch: feature/giq-72-acc-23-risk-category-modal-redundant-title-on-email
---

# GIQ-72 — ACC-23 Risk category modal: redundant title on email addresses

Source of truth: [Linear GIQ-72](https://linear.app/meltstudio/issue/GIQ-72).

## Summary

Removed the `title` attribute from the visible email `<span>` in the risk details modal so the string is not exposed twice to assistive tech (visible text + identical tooltip). No visual layout change; hover no longer shows a native tooltip duplicating the email (acceptable per ticket).

## Files

| File                                                                                                                      | Change                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [`src/features/dashboard/components/risk-details-modal.tsx`](../src/features/dashboard/components/risk-details-modal.tsx) | Drop `title={issue.user.email}` on the email span; keep `truncate` and visible `{issue.user.email}` |

## Validation

### Automated

- [x] `pnpm lint` — pass
- [x] `pnpm type-check` — pass

### Manual (ticket acceptance)

- [ ] WAVE: open `/dashboard`, open risk category modals with user emails — no redundant title alerts on those emails
- [ ] VoiceOver or NVDA: navigate to an email in the modal — announced once without repetition

### Optional

- [ ] `/melt-ux-audit` scoped to dashboard risk modals if doing broader a11y QA
