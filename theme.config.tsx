import React from "react";
import { DocsThemeConfig } from "nextra-theme-docs";
import { BeamIcon } from "./components/Icons";

const config: DocsThemeConfig = {
  logo: <BeamIcon />,
  project: {
    link: "https://github.com/Merit-Circle/beam-docs",
  },
  chat: {
    link: "https://discord.com",
  },
  docsRepositoryBase: "https://github.com/Merit-Circle/beam-docs/tree/main",
  footer: {
    text: "© 2023 Merit Circle",
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
  },
  useNextSeoProps: () => ({
    titleTemplate: "%s | Beam",
  }),
};

export default config;
