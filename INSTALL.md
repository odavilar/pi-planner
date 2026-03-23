INSTALL — PI Capacity Planner
=============================

This document contains step-by-step setup, build and deployment instructions for developers and maintainers.

Prerequisites
-------------
- Node.js LTS (recommended: 18.x or later)
- npm (bundled with Node) or yarn
- Git and a GitHub repository (for deploying to GitHub Pages)

Clone repository
----------------

git clone <repo-url>
cd pi-planner

Install dependencies
--------------------

npm install

Development server
------------------

npm start

Open http://localhost:3000 in your browser.

Run tests
---------

npm test

Build for production
--------------------

npm run build

This creates an optimized build in the `build/` folder.

Deploy to GitHub Pages
---------------------
The project includes `gh-pages` as a dev dependency and a `deploy` script. Ensure `homepage` is set in package.json (for example: "homepage": "/pi-planner").

1. Add the remote and push your main branch to GitHub.
2. Run:

   npm run deploy

`gh-pages` will build and push the `build/` folder to the `gh-pages` branch. On GitHub, enable Pages from the repository Settings → Pages using branch `gh-pages` and folder `/`.

Favicon generation (SVG -> ICO, optional)
-----------------------------------------
If you have a vector SVG favicon and want to generate platform-compatible icons (favicon.ico, PNG sizes), you can add a small Node script.

1. Install helper packages (dev):

   npm install --save-dev sharp png-to-ico

2. Create `scripts/generate-favicon.js` with the following example:

```javascript
// scripts/generate-favicon.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIco = require('png-to-ico');

async function build() {
  const svgPath = path.resolve(__dirname, '..', 'public', 'favicon.svg');
  const outDir = path.resolve(__dirname, '..', 'public');
  const sizes = [16, 32, 48, 64, 128, 256];

  const tmpPngs = [];
  for (const s of sizes) {
    const pngPath = path.join(outDir, `favicon-${s}.png`);
    await sharp(svgPath).resize(s, s).png().toFile(pngPath);
    tmpPngs.push(pngPath);
  }

  // Generate favicon.ico (contains several sizes)
  const icoBuffer = await pngToIco(tmpPngs.slice(0, 3)); // use 16/32/48
  fs.writeFileSync(path.join(outDir, 'favicon.ico'), icoBuffer);
  console.log('Generated favicon.ico and PNG variants in public/');
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

3. Add an npm script to package.json (optional):

   "generate-favicon": "node scripts/generate-favicon.js"

4. Run:

   npm run generate-favicon

This will create `favicon.ico` and several `favicon-<size>.png` files in `public/`. Update `public/index.html` to reference the files you want to use.

Notes and troubleshooting
-------------------------
- If `npm run build` fails, check Node version and installed package compatibilities.
- For gh-pages deployment failures, verify that your remote `origin` points to the correct GitHub repository and you have permission to push.
- If tests fail in CI, run `npm test` locally to reproduce and inspect error output.

CI / Automation
----------------
- Add a CI job that runs `npm ci` (or `npm install`) and `npm test` on pull requests.
- For a deployment pipeline, run `npm run build` and publish `build/` to the hosting target.

Acknowledgements
----------------
- Built with Create React App, Material UI, date-fns and other open source dependencies.

If you'd like, I can also add the `scripts/generate-favicon.js` file and an npm script now. Let me know and I'll implement it.