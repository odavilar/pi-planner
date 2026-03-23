const fs = require('fs').promises;
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const HEADER = '// Copyright (c) 2026 odavilar\n';

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const res = path.join(dir, e.name);
    if (e.isDirectory()) await walk(res);
    else if (/\.(js|jsx)$/.test(e.name)) await addHeader(res);
  }
}

async function addHeader(file) {
  try {
    const content = await fs.readFile(file, 'utf8');
    if (content.startsWith(HEADER) || /Copyright\s*\(c\)\s*2026/i.test(content)) return;
    await fs.writeFile(file, HEADER + content, 'utf8');
    console.log('Updated:', path.relative(ROOT, file));
  } catch (e) {
    console.error('Failed updating', file, e);
  }
}

walk(SRC).catch(err => {
  console.error(err);
  process.exit(1);
});