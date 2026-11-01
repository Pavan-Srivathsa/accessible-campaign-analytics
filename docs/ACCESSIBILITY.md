# Accessibility verification

## Automated coverage

The Playwright suite checks the default page with axe against WCAG 2 A/AA and WCAG 2.1 AA rules, failing for serious and critical findings. It also checks the skip link and navigation between chart values. Passing these tests is not a WCAG conformance certification.

## Manual checklist — not yet performed

1. With VoiceOver/Safari and NVDA/Firefox, find the main landmark and dataset upload control.
2. Read upload guidance, choose a valid CSV, and confirm the update is announced.
3. Upload invalid CSV and confirm the error is announced without losing context.
4. Explore every chart and compare announced values against its HTML table.
5. Open and dismiss the shortcut guide; verify focus restoration and no keyboard trap.
6. Apply the campaign filter and confirm chart data changes are understandable.
7. Read summaries, including the notice that summaries cover the full dataset.
8. Check layout at 200% and 400% zoom and narrow viewport sizes.
9. Check forced-colors/high-contrast mode, visible focus, and reduced motion.
10. Ask users who rely on assistive technologies to complete defined tasks and record issues, with their consent.

## Claims policy

Record browser, OS, assistive technology version, task, result, and issue details for each manual session. Do not describe user-study outcomes or claim screen-reader compatibility based on automated tests alone. Do not substitute the upstream project's reported testing for this application's own testing.
