#!/usr/bin/env node
/**
 * Pulls every Figma component matching icon/<category>/<name> from the
 * shared "Icons" page and writes each one out as an SVGR .tsx component
 * under src/icons/. Config (file key, naming/filename transform, SVGR
 * options) lives in .figma-export.cjs so this script stays a thin runner.
 *
 * Requires FIGMA_TOKEN and FIGMA_FILE_KEY in the environment (see
 * .env.example). Safe to run repeatedly — it overwrites generated files
 * in place.
 */
const fs = require('node:fs');
const path = require('node:path');
const { components } = require('@figma-export/core');

const config = require(path.resolve(__dirname, '../.figma-export.cjs'));
const ICONS_DIR = path.resolve(__dirname, '../src/icons');

async function run() {
  if (!process.env.FIGMA_TOKEN) {
    console.error('Missing FIGMA_TOKEN environment variable. See .env.example.');
    process.exit(1);
  }
  if (!config.fileId) {
    console.error('Missing FIGMA_FILE_KEY environment variable. See .env.example.');
    process.exit(1);
  }

  console.log(`Exporting icons from Figma file ${config.fileId}, page "Icons"...`);
  const pages = await components(config);

  // The SVGR outputter always writes its own per-directory barrel
  // (src/icons/index.ts); we regenerate the real one at src/index.ts via
  // build:catalog instead, so this stray file is just noise — remove it.
  const strayBarrel = path.join(ICONS_DIR, 'index.ts');
  if (fs.existsSync(strayBarrel)) {
    fs.unlinkSync(strayBarrel);
  }

  const exported = pages.flatMap((page) => page.components).length;
  console.log(`Exported ${exported} icon component(s) to src/icons/.`);
  console.log('Run `npm run build:catalog` to regenerate the barrel export.');
}

run().catch((err) => {
  console.error('Figma export failed:', err);
  process.exit(1);
});
