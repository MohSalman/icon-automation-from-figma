import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fg from 'fast-glob';
import path from 'node:path';

// One entry per source file (not a single `src/index.ts` entry) is what lets
// Rollup's `preserveModules` emit one output file per icon instead of a
// single bundled index.js — that per-module output is the actual mechanism
// consumers' bundlers tree-shake against.
const entries = fg.sync('src/**/*.{ts,tsx}', {
  ignore: ['src/stories/**', 'src/**/*.stories.tsx'],
});

const inputEntries = Object.fromEntries(
  entries.map((file) => {
    const name = path.relative('src', file).replace(/\.[^.]+$/, '');
    return [name, path.resolve(__dirname, file)];
  }),
);

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: false,
    rollupOptions: {
      input: inputEntries,
      external: ['react', 'react/jsx-runtime'],
      // Vite defaults this to false for app builds, which Rollup rejects
      // when combined with output.preserveModules — 'strict' keeps each
      // entry's exports intact instead of letting Rollup merge/rename them.
      preserveEntrySignatures: 'strict',
      output: [
        {
          format: 'es',
          dir: 'dist/esm',
          preserveModules: true,
          preserveModulesRoot: 'src',
          entryFileNames: '[name].js',
        },
        {
          format: 'cjs',
          dir: 'dist/cjs',
          preserveModules: true,
          preserveModulesRoot: 'src',
          entryFileNames: '[name].js',
          exports: 'named',
        },
      ],
    },
  },
});
