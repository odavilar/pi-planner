PI Capacity Planner
====================

A lightweight browser-based tool to plan a Program Increment (PI), manage sprints and team members, and visualize capacity, PTO and public holidays across locations.

Purpose
-------
Help teams estimate capacity and story-point allocation across a PI using an interactive calendar view and simple import/export workflows.

Quickstart (fast)
------------------
1. Install dependencies:

	 npm install

2. Start the app locally:

	 npm start

3. Open the app in your browser at http://localhost:3000 (or the URL shown in the console).

Usage (what users care about)
-----------------------------
- Program Increment (PI): define the PI name and date range in the top-left "Program Increment" panel.
- Sprints: add numbered sprints with start/end dates. Sprints drive capacity calculations and colored bands in the calendar.
- Team Members: create members, set `Location` (choose from the built-in holiday calendars), set `Allocation %`, and add PTO ranges.
- Calendar View: shows a 4-month, Mon–Fri calendar with sprint bands, member PTO, and holiday markers (only holidays for active member locations are shown).
- Import / Export: use the import/export control to share PI templates, sprint definitions, or team member lists. Exports only include the data you have filled (team-only exports will not include PI info unless sprints exist).
- Collapse / Expand Calendar: toggle the calendar panel to save space; the calendar is animated when collapsing.

Import/Export behavior (short)
------------------------------
- Exports include only populated sections: PI (only if there are sprints), `sprints`, and/or `members`.
- Import opens a confirmation dialog showing what the file contains; choose `Merge` to merge data or `Replace All` to replace everything.
- Member `location` values are normalized on import to match available holiday calendars (exact match, code prefix, or substring).

Running tests
-------------
Run the test suite:

npm test

Build and deploy
----------------
- Build for production:

	npm run build

- Deploy to GitHub Pages (project expect `homepage` set in package.json):

	npm run deploy

See INSTALL.md for a step-by-step guide and troubleshooting notes.

Files of interest
-----------------
- src/: React source files (UI components, calendar, import/export logic)
- public/: static assets and manifest
- src/holidays.json: bundled public holidays used by the calendar

Help and support
----------------
Open an issue in the repository or contact the repository owner for questions.

License
-------
MIT (or your preferred license)
### `npm run build` fails to minify
