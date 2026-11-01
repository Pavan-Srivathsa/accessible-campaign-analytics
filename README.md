# Campaign Lens — Accessible Campaign Analytics

A standalone React/TypeScript application for exploring advertising campaign data through charts, keyboard interaction, screen-reader descriptions, and equivalent data tables. Includes CSV import, deterministic summaries, optional AI summaries, and server-side numeric claim validation.

This is an independent application, **not the AutoVizuA11y library rebranded**. Its chart accessibility layer is provided by [Feedzai's AutoVizuA11y](https://github.com/feedzai/AutoVizuA11y). See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Run locally

Requires Node.js 22+ and npm. No Python, database, account, or API key is required for the default mode.

```bash
git clone https://github.com/Pavan-Srivathsa/accessible-campaign-analytics.git
cd accessible-campaign-analytics
npm ci
npm run build
npm start
```

Open **http://localhost:3001**. For development, run `npm run dev` and open http://localhost:5173. The development server proxies `/api` requests to the backend on port 3001.

## Features

- Upload a CSV with `campaign,spend,clicks,conversions`; duplicate campaign rows are aggregated.
- Explore three campaign charts: spend, clicks, and conversions. Each has an equivalent HTML data table.
- Filter all three charts and overview totals by campaign.
- Use keyboard navigation and screen-reader descriptions supplied by AutoVizuA11y.
- Read deterministic dataset summaries without using a model.
- Optionally request structured AI claims, which are checked against actual totals and leading campaigns before display.
- Reject malformed CSV, invalid counts, oversized files, unsupported summary claims, and incorrect numerical values.

The bundled CSV is **synthetic**, with six campaigns. All spend values are USD. This demo assumes conversions cannot exceed clicks. It is not a general attribution model.

## Accessibility

Tab moves between controls. The skip link moves focus to the dashboard. In a chart, down arrow enters, left/right arrows move between points, up arrow exits, and `?` opens the upstream shortcut guide. Every chart also has a collapsible table with captions and row/column headers. Errors and dataset changes use live regions. Visible focus, non-color data labels, responsive layouts, and reduced-motion preferences are supported.

Automated axe checks are included. **Automated checks do not establish full WCAG conformance.** Manual VoiceOver/NVDA/JAWS testing and evaluation with disabled users have not been performed by this project. See [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md).

## Optional AI summaries

Export server-side variables before `npm start` or `npm run dev`:

```bash
export OPENAI_API_KEY='your-key'
export OPENAI_MODEL='your-provider-supported-model'
# Optional OpenAI-compatible provider URL:
export OPENAI_BASE_URL='https://api.openai.com/v1'
npm start
```

A `.env.example` documents configuration; `.env` files are not loaded automatically. Never expose keys through `VITE_` variables.

Only pressing **Generate validated AI summary** sends campaign names and metrics to the configured provider. Initial load, CSV upload, filtering, and verified summaries do not call a model. Uploaded data is kept in browser memory and is not persisted by the server. Avoid sensitive datasets if using an external provider.

The model returns structured claims about totals or leading campaigns. The server validates their schema, numeric values, and campaign identity; it displays only text constructed from validated fields. It rejects an invalid response instead of falling back to unchecked model prose. This is intentionally narrower than free-form question answering. AI-provider integration is optional and requires separate live-provider verification.

## Tests

```bash
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Unit and API tests cover CSV parsing, aggregation, invalid data, zero values, ties, hallucinated claims, and request handling. A deterministic generated benchmark checks 100 datasets with 600 truthful claims and 100 deliberately incorrect totals. This benchmark measures the validator, **not model accuracy or user outcomes**.

Browser tests exercise upload/error handling, filters, tables, summary refresh, keyboard navigation, and serious/critical axe findings. CI runs build, unit tests, and Chromium browser tests.

## Architecture

- `src/main.tsx`: React interface and AutoVizuA11y integration.
- `src/analytics.mjs`: CSV parser, aggregation, computed facts, and structured-claim validation shared with the backend.
- `server/index.mjs`: Node HTTP API and production static server; keys remain server-side.
- `data/sample.csv`: reproducible synthetic dataset.
- `tests/`: unit, API, and browser tests.

The implementation deliberately avoids a database and SQL execution: the task is small, campaign-level analytics. Data parsing and deterministic validation are explicit and interview-explainable. CSV uploads are limited to 2 MB, 10,000 data rows, and 50 distinct campaigns.

## License and attribution

AGPL-3.0-only. Uses `@feedzai/autovizua11y` under AGPL-3.0. Attribution, original project links, and the upstream license are preserved. Other dependencies retain their own licenses.

## Known limitations

No authentication, persistent storage, real advertising connectors, speech input, production load testing, or completed disabled-user study. Single-process local/demo server; not a hardened multi-tenant deployment. Summaries always cover the full dataset, while chart filters affect the overview and charts. Equal-value leaders are accepted as ties. Spend is rounded to cents.
