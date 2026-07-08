#!/usr/bin/env node
/**
 * Fails CI if two icon components render byte-identical SVG geometry under
 * different names — the exact failure mode that produced 136 duplicate
 * icon files in the legacy sprite/direct-import systems. Hashes only the
 * <svg>...</svg> markup (whitespace-normalized), not the surrounding
 * component boilerplate, so two icons with different function names but
 * the same paths are still caught.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const fg = require('fast-glob');

const ICONS_DIR = path.resolve(__dirname, '../src/icons');

function extractSvgMarkup(source) {
  const match = source.match(/<svg[\s\S]*?<\/svg>/);
  if (!match) return null;
  return match[0].replace(/\s+/g, ' ').trim();
}

function main() {
  const files = fg.sync('*.tsx', { cwd: ICONS_DIR, absolute: true });
  const seen = new Map();
  const duplicates = [];

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const markup = extractSvgMarkup(source);
    if (!markup) continue;

    const hash = crypto.createHash('sha256').update(markup).digest('hex');
    const name = path.basename(file);

    if (seen.has(hash)) {
      duplicates.push([seen.get(hash), name]);
    } else {
      seen.set(hash, name);
    }
  }

  if (duplicates.length > 0) {
    console.error(`Found ${duplicates.length} duplicate icon(s):`);
    for (const [a, b] of duplicates) {
      console.error(`  - ${a} and ${b} render identical SVG markup`);
    }
    console.error('\nRemove or consolidate one of each pair before publishing.');
    process.exit(1);
  }

  console.log(`No duplicate icons found across ${files.length} file(s).`);
}

main();
