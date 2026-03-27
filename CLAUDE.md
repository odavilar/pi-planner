# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Development server at http://localhost:3000
npm test           # Run tests (Jest, watch mode)
npm test -- --watchAll=false  # Run tests once
npm run build      # Production build to /build
npm run deploy     # Build + deploy to GitHub Pages
```

No explicit lint command — ESLint runs via `react-scripts` (extends `react-app`).

## Architecture

Single-page React app (Create React App) for PI (Program Increment) capacity planning. Fully client-side — no backend.

**`src/App.js`** is the master component (~1100 lines). It holds all state and passes data down as props. All child components are presentational — state changes bubble up via callback props.

### State structure (all in App.js)

```
pi          — { name, startDate, endDate }
sprints     — [{ id, name, startDate, endDate }]
members     — [{ id, name, location, allocation, pto: [{id, fromDate, toDate}] }]
```

Derived data is computed via `useMemo()`:
- `results` — per-sprint capacity per member
- `piTotals` — aggregated PI totals
- `validationIssues` — real-time validation

### Capacity calculation model

`availableDays × (allocation/100) × 8h = capacityHours`
`capacityHours / 8 = storyPoints` (1 SP = 8h)

Available days = working days in sprint − holidays for member's location − PTO days (excluding holidays to avoid double-counting).

### Key data

- Dates are stored/passed as `YYYY-MM-DD` ISO strings throughout
- `src/holidays.json` maps location names to arrays of holiday date strings
- Member `location` must match a key in `holidays.json` for holiday filtering to work
- Sprint names auto-normalize to `{PI.name}.1`, `{PI.name}.2`, etc. when PI name changes

### Import/Export

Plans are exported/imported as JSON with shape `{ pi, sprints, members }`. Import can replace or merge with existing data.

## Key dependencies

- **MUI (Material UI)** — component library and theming
- **date-fns** — date arithmetic
- **`@mui/x-date-pickers`** — DatePicker with date-fns adapter
- **gh-pages** — deployment

## Testing

Tests use mocks for MUI DatePicker components (see `src/setupTests.js` or `__mocks__`). When adding components that use `@mui/x-date-pickers`, mock them similarly to avoid test failures.
