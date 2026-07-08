# icon-automation-from-figma

Tree-shakable React icon package generated from Figma. See
[`MIGRATION_AND_CICD.md`](MIGRATION_AND_CICD.md) for the full Figma
connection and CI/CD rollout plan this package implements.

## Install

```bash
npm install
```

## Local development

```bash
npm run storybook          # browse the icon catalog at localhost:6006
npm run build               # tsc --emitDeclarationOnly + vite build -> dist/
npm run typecheck
npm run lint
npm run check:duplicates    # fails if two icons render identical SVG markup
```

## Connecting to Figma

1. Copy `.env.example` to `.env`.
2. Fill in `FIGMA_TOKEN` (Figma → Settings → Personal access tokens, using
   your own Figma account) and `FIGMA_FILE_KEY` (from your Figma file's URL).
3. Run:

   ```bash
   npm run figma:export   # pulls icon/<category>/<name> components into src/icons/
   npm run build:catalog  # regenerates src/index.ts and src/icon-catalog.json
   ```

`src/icons/` ships with six hand-written sample icons (`ArrowRight`,
`Menu`, `UserAdd`, `Check`, `Close`, `Search`) alongside whatever's been
pulled from Figma, all in the same `IconProps` (`size`/`color`) shape —
Storybook and the build work with or without a Figma connection. See
[`MIGRATION_AND_CICD.md`](MIGRATION_AND_CICD.md) §2 for the real
`@figma-export`/SVGR API details this depends on (several didn't work the
way the packages' own defaults suggest).

## Why this tree-shakes

- Every icon is its own module with its own named export (`IconArrowRight`,
  `IconMenu`, ...) — see `vite.config.ts`, which builds one entry per file
  under `src/` with `preserveModules: true` instead of bundling everything
  into a single `index.js`.
- `"sideEffects": false` in `package.json` tells consumers' bundlers it's
  safe to drop any icon module that isn't imported.
- Zero runtime dependencies beyond a `react` peer dependency.

## Usage in a consuming app

```tsx
import { IconArrowRight } from 'icon-automation-from-figma';

function Footer() {
  return <IconArrowRight size={20} color="currentColor" />;
}
```

## Publishing

GitHub Actions (`.github/workflows/release.yml`) runs the full
export → validate → publish pipeline to the public npm registry
(registry.npmjs.org) under your own npm account. See
[`MIGRATION_AND_CICD.md`](MIGRATION_AND_CICD.md) for pipeline details,
required secrets, and versioning policy.
