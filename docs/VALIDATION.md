# Validation record

Validated locally during implementation on 2026-10-31 (America/Los_Angeles).

| Check | Observed result |
| --- | --- |
| TypeScript and production build | Passed |
| Node unit/API tests | 10 passed |
| Chromium browser tests | 4 passed |
| Default-dashboard axe scan | No serious or critical findings in the configured WCAG 2 A/AA and WCAG 2.1 AA rule sets |
| Generated validator benchmark | Accepted 600 truthful claims; rejected 100 deliberately incorrect totals across 100 synthetic datasets |
| Live external model | Not run; provider protocol and rejection path tested with a local mock |
| Manual screen-reader testing | Not performed |
| Production traffic or user study | Not measured |

The browser tests cover CSV upload and error feedback, campaign filters, table equivalents, deterministic summary refresh, the keyboard skip link, chart-value navigation, and automated accessibility scanning. Metrics above are test results, not user adoption or model-quality outcomes.

The chart dependency uses delayed description initialization. Tests wait for keyboard-focus readiness, and chart components are memoized so unrelated summary changes do not reinitialize chart navigation.
