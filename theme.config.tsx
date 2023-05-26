import React from "react";
import { DocsThemeConfig } from "nextra-theme-docs";
import { BeamIcon } from "./components/Icons";

const config: DocsThemeConfig = {
  logo: <BeamIcon />,
  project: {
    link: "https://github.com/shuding/nextra-docs-template",
  },
  chat: {
    link: "https://discord.com",
  },
  docsRepositoryBase: "https://github.com/Merit-Circle/beam-docs",
  footer: {
    text: "© 2023 Merit Circle",
  },
};

export default config;
