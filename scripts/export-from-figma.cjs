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
const path = require('node:path');
const { components } = require('@figma-export/core');

const config = require(path.resolve(__dirname, '../.figma-export.cjs'));

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

  const exported = pages.flatMap((page) => page.components).length;
  console.log(`Exported ${exported} icon component(s) to src/icons/.`);
  console.log('Run `npm run build:catalog` to regenerate the barrel export.');
}

run().catch((err) => {
  console.error('Figma export failed:', err);
  process.exit(1);
});
