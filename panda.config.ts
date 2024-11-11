import { defineBeamUiConfig } from '@onbeam/styled-system/config';

export default defineBeamUiConfig({
  include: [
    './node_modules/@onbeam/ui/dist/panda.buildinfo.json',
    './node_modules/@onbeam/features/dist/panda.buildinfo.json',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx,mdx}',
  ],
  layers: {
    reset: 'beam-reset',
    base: 'beam-base',
    tokens: 'beam-tokens',
    recipes: 'beam-recipes',
    utilities: 'beam-utilities',
  },
});
