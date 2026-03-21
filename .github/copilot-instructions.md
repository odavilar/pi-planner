# PI Planner - AI Coding Guidelines

## Overview
Single-page React app for Program Increment (PI) capacity planning. Calculates team member capacities considering holidays, PTO, and sprint dates.

## Architecture
- **Main Component**: `App.js` contains all logic and UI components
- **State Management**: Local React state with `useState` hooks
- **Data Flow**: Top-down props from App to child components
- **No Backend**: Client-side only, with JSON export/import for persistence

## Key Components & Patterns
- **Capacity Calculation**: `calcMemberCapacityForSprint()` - working days minus holidays/PTO, multiplied by allocation percentage
- **Date Handling**: ISO format (YYYY-MM-DD), using `date-fns` and MUI DatePicker
- **Holiday Data**: Static `holidays.json` by location (e.g., "New York", "London")
- **Sprint Naming**: Auto-normalized as "PI.1", "PI.2" based on PI name and chronological order

## Developer Workflows
- **Development**: `npm start` - runs on http://localhost:3000
- **Build**: `npm run build` - production build to `build/` folder
- **Test**: `npm test` - runs Jest tests (currently minimal)
- **Data Import/Export**: JSON format with structure `{pi, sprints, members}`

## Conventions
- **Component Style**: Functional components with hooks, all in `App.js`
- **Theme**: Custom MUI theme with specific colors (primary: #0C66E4) and borderRadius: 14px
- **Capacity Model**: 8 hours/day = 1 story point, allocation as percentage (0-100)
- **Date Validation**: Start dates must be before/equal to end dates
- **Error Handling**: Toast notifications via Snackbar for user feedback

## Dependencies
- **UI**: @mui/material, @mui/icons-material, @mui/x-date-pickers
- **Dates**: date-fns for parsing/manipulation
- **Testing**: @testing-library/react, jest-dom

## Examples
- **Adding Sprint**: Validate dates, normalize names, update state
- **Capacity Display**: Show working days, holidays, PTO, available days, hours, story points
- **Import Validation**: Check JSON structure, normalize sprint names on import</content>
<parameter name="filePath">/Users/odavilar/workspace/pi_planning/pi-planner/.github/copilot-instructions.md