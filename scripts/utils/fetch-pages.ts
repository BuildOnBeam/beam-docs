import { createHash } from "crypto";
import { readFile } from "fs/promises";
import GithubSlugger from "github-slugger";
import { Content, Root } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { frontmatterFromMarkdown } from "mdast-util-frontmatter";
import { mdxFromMarkdown } from "mdast-util-mdx";
import { toMarkdown } from "mdast-util-to-markdown";
import { toString } from "mdast-util-to-string";
import { frontmatter } from "micromark-extension-frontmatter";
import { mdxjs } from "micromark-extension-mdxjs";
import { u } from "unist-builder";
import { filter } from "unist-util-filter";
import { walk } from "./walk";

export type Json = Record<
  string,
  string | number | boolean | null | Json[] | { [key: string]: Json }
>;

export type Section = {
  content: string;
  heading?: string;
  slug?: string;
};

function extractMetaTags(mdxTree: Root): Json {
  const metaTagsNode = mdxTree.children.find(({ type }) => type === "yaml");

  if (!metaTagsNode) {
    return {};
  }

  const parsed = metaTagsNode.value.split(/\\r?\\n/).reduce((meta, line) => {
    const [key, value] = line.split(": ");
    return {
      ...meta,
      [key]: value,
    };
  }, {});

  return parsed;
}

/**
 * Splits a `mdast` tree into multiple trees based on
 * a predicate function. Will include the splitting node
 * at the beginning of each tree.
 *
 * Useful to split a markdown file into smaller sections.
 */
function splitTreeBy(tree: Root, predicate: (node: Content) => boolean) {
  return tree.children.reduce<Root[]>((trees, node) => {
    const [lastTree] = trees.slice(-1);

    if (!lastTree || predicate(node)) {
      const tree: Root = u("root", [node]);
      return trees.concat(tree);
    }

    lastTree.children.push(node);
    return trees;
  }, []);
}

/**
 * Parses a markdown heading which can optionally
 * contain a custom anchor in the format:
 *
 * ```markdown
 * ### My Heading [#my-custom-anchor]
 * ```
 */
export function parseHeading(heading: string): {
  heading: string;
  customAnchor?: string;
} {
  const match = heading.match(/(.*) *\[#(.*)\]/);
  if (match) {
    const [, heading, customAnchor] = match;
    return { heading, customAnchor };
  }
  return { heading };
}

/**
 * Processes MDX content for search indexing.
 * It extracts metadata, strips it of all JSX,
 * and splits it into sub-sections based on criteria.
 */
export function processMdx(title: string, content: string): ProcessedMdx {
  const checksum = createHash("sha256").update(content).digest("base64");

  const mdxTree = fromMarkdown(content, {
    extensions: [mdxjs(), frontmatter()],
    mdastExtensions: [mdxFromMarkdown(), frontmatterFromMarkdown(["yaml"])],
  });

  // Extract meta tags from markdown
  const meta = extractMetaTags(mdxTree);
  if (!meta.title) meta.title = title;

  // Remove all MDX elements from markdown
  const mdTree = filter(
    mdxTree,
    (node) =>
      ![
        "mdxjsEsm",
        "mdxJsxFlowElement",
        "mdxJsxTextElement",
        "mdxFlowExpression",
        "mdxTextExpression",
      ].includes(node.type)
  );

  if (!mdTree) {
    return {
      checksum,
      meta,
      sections: [],
    };
  }

  const sectionTrees = splitTreeBy(mdTree, (node) => node.type === "heading");

  const slugger = new GithubSlugger();

  const sections = sectionTrees
    // Filter out trees that contain only the page's metadata
    .filter(({ children }) => children[0]?.type !== "yaml")
    .map((tree) => {
      const [firstNode] = tree.children;

      const content = toMarkdown(tree);

      const rawHeading: string =
        firstNode.type === "heading" ? toString(firstNode) : undefined;

      if (!rawHeading) {
        return { content };
      }

      const { heading, customAnchor } = parseHeading(rawHeading);

      const slug = slugger.slug(customAnchor ?? heading);

      return {
        content,
        heading,
        slug,
      };
    });

  return {
    checksum,
    meta,
    sections,
  };
}

export type ProcessedMdx = {
  checksum: string;
  meta: Json;
  sections: Section[];
};

/**
 * Fetch the title for a page from its meta data, falling back to the slug
 * @param meta
 * @param slug
 * @returns
 */
const metaTitle = (meta: Json, slug: string): string => {
  if (!meta[slug]) return slug;

  if (typeof meta[slug] === "object") {
    return `${(meta[slug] as Json).title}` ?? slug;
  }

  return meta[slug] as string;
};

const page = (filePath: string, parentFilePath?: string) => {
  const path = filePath.replace(/^pages/, "").replace(/\.mdx?$/, "");
  const parentPath = parentFilePath
    ?.replace(/^pages/, "")
    .replace(/\.mdx?$/, "");

  return {
    type: "page",
    path,
    parentPath,
    load: async () => {
      const contents = await readFile(filePath, "utf8");

      const slug = filePath
        .split("/")
        .at(-1)
        .replace(/\.mdx?$/, "");

      const metaPath = filePath.replace(/[^/]+$/, "_meta.json");
      const metaJson = await readFile(metaPath, "utf8");

      const title = metaTitle(JSON.parse(metaJson), slug);

      const { checksum, meta, sections } = processMdx(title, contents);

      return {
        checksum,
        meta,
        sections,
      };
    },
  };
};

async function fetchPages() {
  const ignoredFiles = ["pages/index.mdx", "pages/404.mdx"];

  const pages = (await walk("pages"))
    .filter(({ path }) => /\.mdx?$/.test(path))
    .filter(({ path }) => !ignoredFiles.includes(path))
    .map((entry) => page(entry.path));

  return pages;
}

export default fetchPages;
