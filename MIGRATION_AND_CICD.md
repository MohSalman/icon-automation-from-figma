# icon-automation-from-figma — Figma Connection & CI/CD Guide

Companion doc to the icon-package proposal. That deck makes the case for a
dedicated, tree-shakable icon package; this doc is the runbook for standing
one up as a personal/demo project: your own Figma account, your own GitHub
repo, published to the public npm registry under your own account — no
shared design team, no internal Nexus registry.

The package itself lives in
[`icon-automation-from-figma/`](icon-automation-from-figma/) and is built
and verified — see "Current status" below for exactly what that means.

---

## 1. Current status

| Stage | Status |
|---|---|
| Package scaffold (build, types, tree-shaking config) | **Done.** Builds, type-checks, lints, and passes the duplicate-hash gate. Ships with 6 hand-written sample icons in the exact shape the Figma pipeline would generate, so the package is usable today without live Figma access. |
| Figma pipeline wiring | **Config and scripts done; not yet run against a real file.** `.figma-export.cjs` and `scripts/export-from-figma.cjs` are in place. Blocked on you supplying a real `FIGMA_TOKEN` and `FIGMA_FILE_KEY` — see §2. |
| GitHub Actions CI/CD | **Done.** `.github/workflows/ci.yml` (validate on push/PR) and `.github/workflows/release.yml` (export + publish) are in place. |
| Publish to npmjs.org | **Not yet run.** Needs an `NPM_TOKEN` secret — see §3. |
| Migrate a consuming app onto this package | **Not started** — that happens in whatever app repo ends up importing this package, not here. |

---

## 2. Connecting to Figma (personal account)

1. In your own Figma account, create (or reuse) a file with a page named
   exactly **`Icons`**.
2. Build each icon as a real Figma **component** (not a loose frame/shape),
   named `icon/<category>/<name>` — e.g. `icon/navigation/arrow-right`.
   `.figma-export.cjs` filters on this exact pattern
   (`^icon\/([\w-]+)\/([\w-]+)$`) and silently skips anything that doesn't
   match.
3. Keep each icon on a clean 24×24 frame, single-color where possible, so
   the pipeline's `replaceAttrValues` fill-normalization step can safely
   convert hardcoded fills to `currentColor`.
4. Generate a **Figma Personal Access Token**: Figma → account Settings →
   Personal access tokens.
5. Get the **file key** from your Figma file's URL:
   `https://www.figma.com/file/<FILE_KEY>/...`.
6. Copy `icon-automation-from-figma/.env.example` to `.env` for local
   testing (gitignored — never commit real tokens).
7. Run the export once locally before trusting CI with it:

   ```bash
   cd icon-automation-from-figma
   npm install
   npm run figma:export     # pulls real icons into src/icons/
   npm run build:catalog    # regenerates src/index.ts + icon-catalog.json
   npm run check:duplicates # must pass before committing
   npm run build            # confirm it still compiles
   ```

### Known gap to close before trusting this unattended

`.figma-export.cjs` and `scripts/export-from-figma.cjs` are written against
the documented `@figma-export/core` v6 API (`components()`,
`filterComponent`, `transformComponentsToOutput`, the SVGR outputter's
`getComponentName`/`options`). This has **not been run against a real
Figma file** — do a supervised first run and diff the output against the 6
sample icons' shape before relying on the scheduled workflow unattended.

---

## 3. GitHub setup

1. Push `icon-automation-from-figma/` to a new GitHub repo (it can be the
   repo root).
2. Repo Settings → Secrets and variables → **Actions** → add:
   - `FIGMA_TOKEN`
   - `FIGMA_FILE_KEY`
   - `NPM_TOKEN` — an npm **Automation** token from
     [npmjs.com](https://www.npmjs.com) (account Settings → Access Tokens),
     scoped to publish `icon-automation-from-figma`. Automation tokens
     bypass 2FA prompts, which is required for unattended CI publishes.
3. No org/scope is required — the package publishes unscoped
   (`icon-automation-from-figma`) to the public registry under your account.

---

## 4. CI/CD pipeline

Two workflows, both under `.github/workflows/`:

### `ci.yml` — validate on every push/PR

Checkout → `npm ci` → duplicate-hash gate → lint → typecheck → build →
`build-storybook`. No secrets required; this is the safety net for any
change, including hand-edited icons.

### `release.yml` — export from Figma and publish

Manual trigger (`workflow_dispatch`) or nightly at 02:00 UTC
(`schedule: cron: '0 2 * * *'`) — adjust or remove the schedule once the
Figma connection is proven out. Steps:

1. `npm run figma:export` — pulls matching components from Figma (needs
   `FIGMA_TOKEN`, `FIGMA_FILE_KEY` secrets).
2. `npm run build:catalog` — regenerates the barrel export + JSON catalog.
3. Validation: duplicate-hash gate, lint, typecheck, `build-storybook`.
4. `stefanzweifel/git-auto-commit-action` commits any regenerated files in
   `src/icons/`, `src/index.ts`, `src/icon-catalog.json` straight back to
   the branch the workflow ran on.
5. `npx semantic-release` — bumps the version per `.releaserc.json`, builds
   the package (via the `@semantic-release/exec` `prepareCmd`), publishes
   to npmjs.org, and creates a GitHub release. Needs `GITHUB_TOKEN`
   (provided automatically by Actions) and `NODE_AUTH_TOKEN` (mapped from
   the `NPM_TOKEN` secret — `actions/setup-node`'s generated `.npmrc`
   reads that exact variable name, not `NPM_TOKEN`).

### Build order gotcha (already hit and fixed here)

`vite.config.ts` sets `build.emptyOutDir: true`. If `tsc
--emitDeclarationOnly` runs *before* `vite build`, Vite deletes the `.d.ts`
files it just wrote. The `build` script in `package.json` is ordered
`build:catalog && vite build && tsc --emitDeclarationOnly` — keep it in
that order if this ever gets refactored.

### How this achieves real tree-shaking (verified, not just claimed)

Two settings, both already in place:

- `vite.config.ts` builds **one Rollup entry per source file** (via a
  `fast-glob` scan of `src/**/*.{ts,tsx}`) with `output.preserveModules:
  true` — so `dist/esm/` ends up with one `.js` file per icon, not a single
  bundled `index.js`.
- `package.json` sets `"sideEffects": false`, telling downstream bundlers
  it's safe to drop any icon module a consumer doesn't import.

This was confirmed directly, not just asserted: building the package and
then bundling a throwaway consumer that imports only `IconArrowRight` with
esbuild produces a 559-byte output containing *only* `IconArrowRight` — the
other five sample icons don't appear in the bundle at all.

---

## 5. Versioning policy

Semver via `semantic-release` reading conventional commit messages:

- **patch** — icon additions (non-breaking by definition)
- **minor** — new `Icon` wrapper props, new categories, new export shapes
- **major** — renaming/removing an existing icon or export; requires a
  deprecation notice one minor version ahead

Consuming apps bump `icon-automation-from-figma` in their own
`package.json` on their own schedule. Publishing a new version here never
forces an update anywhere else.

---

## 6. Using it in a consuming app

```bash
npm install icon-automation-from-figma
```

```tsx
import { IconArrowRight } from 'icon-automation-from-figma';

function Footer() {
  return <IconArrowRight size={20} color="currentColor" />;
}
```

If migrating off an existing sprite/direct-SVG-import setup, do it feature
by feature rather than in one large PR — that keeps each change reviewable
and independently revertible, and gives you a natural checkpoint for
sanity-checking that each replaced icon still renders correctly.
