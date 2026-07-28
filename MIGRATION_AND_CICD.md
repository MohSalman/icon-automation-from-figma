# icon-automation-from-figma — Figma Connection & CI/CD Guide

Companion doc to the icon-package proposal. That deck makes the case for a
dedicated, tree-shakable icon package; this doc is the runbook for standing
one up as a personal/demo project: your own Figma account, your own GitHub
repo, published to the public npm registry under your own account — no
shared design team, no internal Nexus registry.

This package is built and verified — see "Current status" below for
exactly what that means.

---

## 1. Current status

| Stage                                                | Status                                                                                                                                                                                                                                                                             |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package scaffold (build, types, tree-shaking config) | **Done.** Builds, type-checks, lints, and passes the duplicate-hash gate.                                                                                                                                                                                                          |
| Figma pipeline wiring                                | **Done and run against a real Figma file.** `.figma-export.cjs` pulls real components, converts them through SVGR into the same `IconProps` (`size`/`color`) shape as the hand-written sample icons, and regenerates the barrel. See §2 for the exact API details this depends on. |
| GitHub Actions CI/CD                                 | **Done.** `.github/workflows/ci.yml` (validate on push/PR) and `.github/workflows/release.yml` (export + publish) are in place; not yet run in Actions itself (only run locally so far).                                                                                           |
| Publish to npmjs.org                                 | **Not yet run.** Needs an `NPM_TOKEN` secret — see §3.                                                                                                                                                                                                                             |
| Migrate a consuming app onto this package            | **Not started** — that happens in whatever app repo ends up importing this package, not here.                                                                                                                                                                                      |

---

## 2. Connecting to Figma (personal account)

1. In your own Figma account, create (or reuse) a file with a page named
   exactly **`Icons`**.
2. Build each icon as a real Figma **component** (not a loose frame/shape),
   named `icon/<category>/<name>` — e.g. `icon/navigation/arrow-right`.
   `.figma-export.cjs` filters on this exact pattern
   (`^icon\/([\w-]+)\/([\w-]+)$`) and silently skips anything that doesn't
   match. Figma component names use `/` as a path separator, and
   `@figma-export/core` splits on it via `node:path` — `icon/gender/male`
   becomes `dirname: "icon/gender"`, `basename: "male"`.
3. Keep each icon on a clean 24×24 frame — color doesn't matter. The
   pipeline force-converts _every_ fill/stroke color to `currentColor`
   (not just literal black), via a custom SVGO `convertColors` predicate
   that matches unconditionally, so design can use any color as a
   placeholder and it still resolves to `currentColor` in code.
4. Generate a **Figma Personal Access Token**: Figma → account Settings →
   Personal access tokens.
5. Get the **file key** from your Figma file's URL:
   `https://www.figma.com/file/<FILE_KEY>/...`.
6. Copy `icon-automation-from-figma/.env.example` to `.env` for local
   testing (gitignored — never commit real tokens).
7. Run the export:
   set -a
   source .env
   set +a

   ```bash
   cd icon-automation-from-figma
   npm install
   npm run figma:export     # pulls real icons into src/icons/
   npm run build:catalog    # regenerates src/index.ts + icon-catalog.json
   npm run check:duplicates # must pass before committing
   npm run build            # confirm it still compiles
   ```

### API details this depends on (verified directly, not just documented)

`@figma-export/core`'s `components()` function does **not** read
`FIGMA_TOKEN` from the environment itself — it only reads a `token` field
on the config object passed to it. `.figma-export.cjs` forwards
`process.env.FIGMA_TOKEN` into that field explicitly; without it, the
export fails immediately with `'Access Token' is missing`.

`@figma-export/output-components-as-svgr`'s SVGR integration also needs
more than it first appears:

- `@svgr/core`'s `transform()` runs **zero transforms** unless you pass an
  explicit `plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx']` — omit it
  and every icon is written out as untransformed, invalid raw SVG XML
  inside a `.tsx` file. Both plugins are separate npm packages (not
  bundled with `@svgr/core` or the figma-export outputter) and are
  declared as direct devDependencies here for that reason.
- The outputter's `getComponentName`/`getDirname`/etc. callbacks receive
  the whole per-component `options` object (`{ pageName, componentName,
dirname, basename }`), not a plain name string.
- Default output nests files under `<output>/<pageName>/<dirname>/` using
  a `.jsx` extension. `.figma-export.cjs` overrides `getDirname: () => ''`
  to flatten into `src/icons/` directly, and `getFileExtension: () =>
'.tsx'` for TypeScript output.
- To get the same `size`/`color` prop contract as the hand-written sample
  icons (`export function IconX({ size, color, ...props }: IconProps)`),
  the config sets `jsxRuntime: 'automatic'` (no manual `React` import),
  `dimensions: false` + `svgProps: { width: '{size}', height: '{size}' }`
  (SVGR's built-in dimension handling ignores `replaceAttrValues` for
  width/height, so injecting them via `svgProps` is the reliable path),
  and a custom `template` function that wraps the generated JSX in our own
  function signature instead of SVGR's default export.
- The outputter always writes its own per-directory barrel file
  (`index.ts`/`index.js`). `scripts/export-from-figma.cjs` deletes it
  after every export — the real barrel is regenerated separately by
  `npm run build:catalog`, which also covers hand-written icons.

This was all confirmed by running a real export against a personal Figma
file with two live icons (`icon/gender/male`, `icon/building/hospital`)
and checking the generated `.tsx` output matched the hand-written sample
icons' shape exactly, then running it through `check:duplicates`,
`typecheck`, `lint`, `build`, and `build-storybook`.

### One real limitation to know about

Filenames and export names are derived from `basename` alone (per the
proposal's own naming convention, category is dropped) — two icons in
different categories with the same basename (e.g. `icon/a/close` and
`icon/b/close`) will silently overwrite each other's output file. The
duplicate-hash gate catches identical _content_ under different names, not
this case. Worth a naming convention rule for design (no repeated
basenames across categories) if the icon set grows past a couple dozen.

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

`

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
--emitDeclarationOnly` runs _before_ `vite build`, Vite deletes the `.d.ts`
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
esbuild produces a 559-byte output containing _only_ `IconArrowRight` — the
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
import { IconArrowRight } from "icon-automation-from-figma";

function Footer() {
  return <IconArrowRight size={20} color="currentColor" />;
}
```

If migrating off an existing sprite/direct-SVG-import setup, do it feature
by feature rather than in one large PR — that keeps each change reviewable
and independently revertible, and gives you a natural checkpoint for
sanity-checking that each replaced icon still renders correctly.
