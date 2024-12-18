import nextra from 'nextra';

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
  staticImage: true,
  search: {
    codeblocks: false,
  },
  defaultShowCopyCode: true,
});

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/service/:slug*',
        destination: '/sdk/:slug*',
        permanent: true,
      },
      {
        source: '/chain/nodes/beam-node',
        destination: '/chain/nodes/introduction',
        permanent: true,
      },
    ];
  },
};

export default withNextra(nextConfig);
