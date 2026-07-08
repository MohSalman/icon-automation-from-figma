import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/stories/**/*.stories.@(ts|tsx)'],
  // As of Storybook 9+, controls/actions/backgrounds/viewport etc. ship in
  // core — @storybook/addon-essentials was retired. Docs is the one piece
  // that's still opt-in.
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};

export default config;
