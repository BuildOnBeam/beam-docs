import { DocsThemeConfig } from "nextra-theme-docs";
import React from "react";
import { BeamIcon } from "./components/beam-icons";

const config: DocsThemeConfig = {
  logo: BeamIcon,
  project: {
    link: "https://github.com/Merit-Circle/beam-docs",
  },
  docsRepositoryBase: "https://github.com/Merit-Circle/beam-docs/tree/main",
  useNextSeoProps: () => ({
    titleTemplate: "%s | Beam documentation",
  }),
  head: () => {
    const ogTitle = "Hello Beam! | Beam documentation";
    const ogDescription =
      "Beam is a sovereign network focused on gaming brought to you by the Merit Circle DAO.";
    const ogImage = "https://docs.onbeam.com/beam-development-docs.png";

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
    text: "© 2023 Merit Circle",
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
  },

  primaryHue: { dark: 33, light: 33 },
  feedback: {
    content: null,
  },
  darkMode: false,
  nextThemes: {
    defaultTheme: "dark",
  },
};

export default config;
