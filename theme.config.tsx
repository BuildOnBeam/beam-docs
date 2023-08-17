import React from "react";
import { DocsThemeConfig } from "nextra-theme-docs";
import { BeamIcon } from "./components/beam-icons";

const config: DocsThemeConfig = {
  logo: BeamIcon,
  project: {
    link: "https://docs.onbeam.com/",
  },
  docsRepositoryBase: "https://github.com/Merit-Circle/beam-docs/tree/main",
  useNextSeoProps: () => ({
    titleTemplate: "%s | Beam documentation",
    description: 'Beam is a sovereign network focused on gaming brought to you by the Merit Circle DAO.'
  }),
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
