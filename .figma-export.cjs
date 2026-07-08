/**
 * @figma-export/cli config.
 *
 * Auth: the Figma Personal Access Token is read from the FIGMA_TOKEN
 * environment variable by @figma-export/core itself — it is never
 * written here or committed to the repo. Set it locally in `.env`
 * (gitignored) and as a GitHub Actions repository secret in CI.
 */
const outputComponentsAsSvgr = require('@figma-export/output-components-as-svgr').default;

const ICON_NAME_PATTERN = /^icon\/([\w-]+)\/([\w-]+)$/;

module.exports = {
  fileId: process.env.FIGMA_FILE_KEY,
  onlyFromPages: ['Icons'],
  concurrency: 30,

  // Only pick up components that follow the icon/<category>/<name> convention
  // documented for the design team — anything else on the page is ignored.
  filterComponent: (component) => ICON_NAME_PATTERN.test(component.name),

  // icon/navigation/arrow-right -> ArrowRight (PascalCase, category dropped
  // from the filename since it is only needed for organizing the Figma page).
  transformComponentsToOutput: (components) =>
    components.map((component) => {
      const match = component.name.match(ICON_NAME_PATTERN);
      const [, category, name] = match;
      const pascalName = name
        .split('-')
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join('');
      return { ...component, category, name: pascalName };
    }),

  outputters: [
    outputComponentsAsSvgr({
      output: './src/icons',
      getComponentName: (name) => `Icon${name}`,
      options: {
        typescript: true,
        // Normalize hardcoded fills/strokes to currentColor so consumers can
        // recolor icons the same way as any other text, per the design
        // guideline of building icons single-color on a clean 24x24 frame.
        replaceAttrValues: { '#000': 'currentColor', '#000000': 'currentColor' },
      },
    }),
  ],
};
