/**
 * @figma-export/cli config.
 *
 * Auth: @figma-export/core's `components()` reads the token from a `token`
 * field on this config object — it does NOT read FIGMA_TOKEN itself. We
 * forward it from the environment here so the real value is never written
 * to or committed from this file. Set FIGMA_TOKEN locally in `.env`
 * (gitignored) and as a GitHub Actions repository secret in CI.
 */
const outputComponentsAsSvgr = require('@figma-export/output-components-as-svgr').default;
const { pascalCase } = require('@figma-export/utils');

const ICON_NAME_PATTERN = /^icon\/([\w-]+)\/([\w-]+)$/;

module.exports = {
  token: process.env.FIGMA_TOKEN,
  fileId: process.env.FIGMA_FILE_KEY,
  onlyFromPages: ['Icons'],
  concurrency: 30,

  // Only pick up components that follow the icon/<category>/<name> convention
  // documented for the design team — anything else on the page is ignored.
  // (Figma component names use "/" as a path separator, which is also how
  // @figma-export/core derives figmaExport.dirname/basename via node:path —
  // e.g. "icon/navigation/arrow-right" -> dirname "icon/navigation",
  // basename "arrow-right".)
  filterComponent: (component) => ICON_NAME_PATTERN.test(component.name),

  outputters: [
    outputComponentsAsSvgr({
      output: './src/icons',
      // Flatten output: default behavior nests files under
      // <output>/<pageName>/<dirname>/, but every icon here already has a
      // unique basename, so a single flat directory is simpler to consume
      // and matches the hand-written sample icons' layout.
      getDirname: () => '',
      // icon/navigation/arrow-right -> ArrowRight.tsx exporting IconArrowRight,
      // per the naming convention documented for design (category is only
      // for organizing the Figma page, not reflected in the output).
      getComponentFilename: (options) => pascalCase(options.basename),
      getComponentName: (options) => `Icon${pascalCase(options.basename)}`,
      getFileExtension: () => '.tsx',
      // The outputter always writes its own per-directory barrel; we
      // regenerate the real one ourselves via scripts/build-catalog.cjs
      // (which also covers hand-written icons), so make this one inert.
      getExportTemplate: () => '',
      getSvgrConfig: () => ({
        typescript: true,
        jsxRuntime: 'automatic',
        dimensions: false,
        // @svgr/core runs no transforms at all without an explicit plugins
        // list (confirmed directly — omitting this silently produced
        // untransformed passthrough SVG instead of a React component).
        plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
        expandProps: 'end',
        svgProps: { width: '{size}', height: '{size}' },
        // Design builds icons single-color on a 24x24 frame (see design
        // guidelines); forcing every color value to currentColor here
        // (rather than only literal #000) is what makes that guideline
        // actually hold regardless of which color a designer picks.
        svgoConfig: {
          plugins: [
            'preset-default',
            { name: 'convertColors', params: { currentColor: () => true } },
          ],
        },
        replaceAttrValues: { currentColor: '{color}' },
        template: (variables, { tpl }) => tpl`
import type { IconProps } from '../Icon';
import { DEFAULT_ICON_SIZE, DEFAULT_ICON_COLOR } from '../Icon';

export function ${variables.componentName}({
  size = DEFAULT_ICON_SIZE,
  color = DEFAULT_ICON_COLOR,
  ...props
}: IconProps) {
  return ${variables.jsx};
}
`,
      }),
    }),
  ],
};
