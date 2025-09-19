import { flex, hstack } from '@onbeam/business-styled-system/patterns';
import { useCookieConsentStore } from '@onbeam/utils';
import { DocsThemeConfig } from 'nextra-theme-docs';
import { useConfig } from 'nextra-theme-docs';
import { BeamIcon } from './components/beam-icons';
import { token } from '@onbeam/business-styled-system/tokens';

const linkStyle = flex({
  position: 'relative',
  align: 'center',
  truncate: true,

  _before: {
    content: '""',
    position: 'absolute',
    bottom: '[3px]',
    left: '0',
    w: '[0]',
    h: '[1px]',
    bgColor: '[currentColor]',
    transitionProperty: 'width',
    transitionDuration: '[250ms]',
    transitionTimingFunction: 'ease',
  },

  _supportsHover: {
    _hover: {
      _before: {
        w: 'full',
      },
    },
  },
  _focusActive: {
    _before: {
      w: 'full',
    },
  },
});

const config: DocsThemeConfig = {
  logo: BeamIcon,
  project: {
    link: 'https://github.com/BuildOnBeam/beam-docs',
  },
  docsRepositoryBase: 'https://github.com/BuildOnBeam/beam-docs/tree/main',
  head: () => {
    const config = useConfig();

    const title = config.frontMatter.title || config.title;
    const ogTitle = `${
      title ? title : 'Hello Beam!'
    } | Beam Docs: Your Gateway to Web3 Frontier Tech Development`;
    const ogDescription =
      config.frontMatter.description ||
      "Discover Beam's SDK and developer resources for Web3. Access API docs, tutorials, and integration guides for building with Beam.";
    const ogImage = 'https://docs.onbeam.com/opengraph-image.png';

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
      const open = useCookieConsentStore((store) => store.openConsentModal);

      return (
        <footer
          className={hstack({
            align: 'center',
            gap: '4',
            px: '4',
            py: '4',
            textStyle: 'body-sm',
            color: 'mono.tertiary',
          })}
        >
          <span>GPL v.3.0 {new Date().getFullYear()} © Beam</span>
          <a
            href="https://onbeam.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className={linkStyle}
          >
            Terms of Use
          </a>
          <a
            href="https://onbeam.com/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className={linkStyle}
          >
            Privacy Policy
          </a>
          <button type="button" className={linkStyle} onClick={open}>
            Cookies
          </button>
        </footer>
      );
    },
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
  },
  color: {
    hue: 0,
    saturation: 0,
    lightness: {
      light: 50,
      dark: 100,
    },
  },
  backgroundColor: {
    light: token('colors.mono.primaryFg'),
    dark: token('colors.mono.primaryFg'),
  },
  feedback: {
    content: null,
  },
  nextThemes: {
    defaultTheme: 'light',
  },
};

export default config;
