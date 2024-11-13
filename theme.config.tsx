import { DocsThemeConfig } from 'nextra-theme-docs';
import React from 'react';
import { BeamIcon } from './components/beam-icons';
import { useConfig } from 'nextra-theme-docs';
import { useGTMStore } from '@onbeam/utils';
import { hstack, text } from '@onbeam/styled-system/patterns';
import { Link } from '@onbeam/ui';

const config: DocsThemeConfig = {
  logo: BeamIcon,
  project: {
    link: 'https://github.com/BuildOnBeam/beam-docs',
  },
  docsRepositoryBase: 'https://github.com/BuildOnBeam/beam-docs/tree/main',
  head: () => {
    const config = useConfig();

    const title = config.frontMatter.title || config.title;
    const ogTitle = `${title ? title : 'Hello Beam!'} | Beam documentation`;
    const ogDescription =
      config.frontMatter.description ||
      'Beam is a sovereign network focused on gaming.';
    const ogImage = 'https://docs.onbeam.com/beam-development-docs.png';

    return (
      <>
        {/* Favicons, meta */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        {/* <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg" /> */}
        <link rel="manifest" href="/site.webmanifest" />
        {/* <link
          rel="mask-icon"
          href="/favicon/safari-pinned-tab.svg"
          color="#000000"
        /> */}
        <title>{ogTitle}</title>
        <meta httpEquiv="Content-Language" content="en-US" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="apple-mobile-web-app-title" content="Beam" />
        <meta name="description" content={ogDescription} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@buildonbeam" />
        <meta name="twitter:image" content={ogImage} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:locale" content="en_US" />
      </>
    );
  },
  footer: {
    component: () => {
      const open = useGTMStore((store) => store.openConsentModal);

      return (
        <footer
          className={hstack({
            align: 'center',
            gap: '4',
            px: '4',
            py: '4',
            color: 'mono.100',
            bg: 'mono.650',
            borderTop: '1px solid',
            borderColor: 'mono.550',
          })}
        >
          <span className={text({ style: 'sm' })}>
            GPL v.3.0 {new Date().getFullYear()} © Beam
          </span>
          <Link
            as="button"
            color="mono.100"
            className={text({ style: 'sm', cursor: 'pointer' })}
            onClick={open}
          >
            cookies
          </Link>
        </footer>
      );
    },
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
  },
  color: {
    hue: { dark: 33, light: 33 },
  },
  feedback: {
    content: null,
  },
  darkMode: false,
  nextThemes: {
    defaultTheme: 'dark',
  },
};

export default config;
