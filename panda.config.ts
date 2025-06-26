import { defineBeamUiConfig } from '@onbeam/business-styled-system/config';

export default defineBeamUiConfig({
  include: [
    './node_modules/@onbeam/business-ui/dist/panda.buildinfo.json',
    './node_modules/@onbeam/business-features/dist/panda.buildinfo.json',
    './**/*.{ts,tsx}',
    './pages/**/*.mdx',
  ],
  preflight: false,
  layers: {
    reset: 'beam-reset',
    base: 'beam-base',
    tokens: 'beam-tokens',
    recipes: 'beam-recipes',
    utilities: 'beam-utilities',
  },
});
