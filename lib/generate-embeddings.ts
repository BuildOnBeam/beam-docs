import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import GithubSlugger from 'github-slugger';
import { Content, Root } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { frontmatterFromMarkdown } from 'mdast-util-frontmatter';
import { mdxFromMarkdown } from 'mdast-util-mdx';
import { toMarkdown } from 'mdast-util-to-markdown';
import { toString as toStringUtil } from 'mdast-util-to-string';
import { frontmatter } from 'micromark-extension-frontmatter';
import { mdxjs } from 'micromark-extension-mdxjs';
import OpenAI from 'openai';
import { u } from 'unist-builder';
import { filter } from 'unist-util-filter';
import yargs from 'yargs';

dotenv.config();

const ignoredFiles = ['pages/_app.mdx', 'pages/index.mdx', 'pages/404.mdx'];

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
      const tree: Root = u('root', [node]);
      return trees.concat(tree);
    }

    lastTree.children.push(node);
    return trees;
  }, []);
}

function extractMetaTags(mdxTree: Root) {
  const metaTagsNode = mdxTree.children.find(({ type }) => type === 'yaml');

  if (!metaTagsNode) {
    return {};
  }

  const parsed = metaTagsNode.value.split(/\\r?\\n/).reduce((meta, line) => {
    const [key, value] = line.split(': ');
    return {
      ...meta,
      [key]: value,
    };
  }, {});

  return parsed;
}

/**
 * Fetch the title for a page from its meta data, falling back to the slug
 * @param meta
 * @param slug
 * @returns
 */

const parseMetaTitle = (meta: any, slug: string): string => {
  if (!meta[slug]) return slug;

  if (typeof meta[slug] === 'object') {
    return meta[slug]?.title ? `${(meta[slug] as any).title}` : slug;
  }

  return meta[slug] as string;
};

type Meta = ReturnType<typeof extractMetaTags>;

type Section = {
  content: string;
  heading?: string;
  slug?: string;
};

type ProcessedMdx = {
  checksum: string;
  meta: Meta;
  sections: Section[];
};

/**
 * Processes MDX content for search indexing.
 * It extracts metadata, strips it of all JSX,
 * and splits it into sub-sections based on criteria.
 */
function processMdxForSearch(title: string, content: string): ProcessedMdx {
  const checksum = createHash('sha256').update(content).digest('base64');

  const mdxTree = fromMarkdown(content, {
    extensions: [mdxjs(), frontmatter()],
    mdastExtensions: [mdxFromMarkdown(), frontmatterFromMarkdown(['yaml'])],
  });

  // Extract meta tags from markdown
  const meta = extractMetaTags(mdxTree);
  if (!meta.title) meta.title = title;

  // Remove all MDX elements from markdown
  const mdTree = filter(
    mdxTree,
    (node) =>
      ![
        'mdxjsEsm',
        'mdxJsxFlowElement',
        'mdxJsxTextElement',
        'mdxFlowExpression',
        'mdxTextExpression',
      ].includes(node.type),
  );

  if (!mdTree) {
    return {
      checksum,
      meta,
      sections: [],
    };
  }

  const sectionTrees = splitTreeBy(mdTree, (node) => node.type === 'heading');

  const slugger = new GithubSlugger();

  const sections = sectionTrees
    // Filter out trees that contain only the page's metadata
    .filter(({ children }) => children[0]?.type !== 'yaml')
    .map((tree) => {
      const [firstNode] = tree.children;

      const heading =
        firstNode.type === 'heading' ? toStringUtil(firstNode) : undefined;
      const slug = heading ? slugger.slug(heading) : undefined;

      return {
        content: toMarkdown(tree),
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

type WalkEntry = {
  path: string;
  parentPath?: string;
};

async function walk(dir: string, parentPath?: string): Promise<WalkEntry[]> {
  const immediateFiles = await readdir(dir);

  const recursiveFiles = await Promise.all(
    immediateFiles.map(async (file) => {
      const path = join(dir, file);
      const stats = await stat(path);
      if (stats.isDirectory()) {
        // Keep track of document hierarchy (if this dir has corresponding doc file)
        const docPath = `${basename(path)}.mdx`;

        return walk(
          path,
          immediateFiles.includes(docPath)
            ? join(dirname(path), docPath)
            : parentPath,
        );
      }
      if (stats.isFile()) {
        return [
          {
            path: path,
            parentPath,
          },
        ];
      }
      return [];
    }),
  );

  const flattenedFiles = recursiveFiles.reduce(
    (all, folderContents) => all.concat(folderContents),
    [],
  );

  return flattenedFiles.sort((a, b) => a.path.localeCompare(b.path));
}

abstract class BaseEmbeddingSource {
  checksum?: string;
  meta?: Meta;
  sections?: Section[];

  constructor(
    public source: string,
    public path: string,
    public parentPath?: string,
  ) {}

  abstract load(): Promise<{
    checksum: string;
    meta?: Meta;
    sections: Section[];
  }>;
}

class MarkdownEmbeddingSource extends BaseEmbeddingSource {
  type = 'markdown' as const;

  constructor(
    source: string,
    public filePath: string,
    public parentFilePath?: string,
  ) {
    const path = filePath.replace(/^pages/, '').replace(/\.mdx?$/, '');
    const parentPath = parentFilePath
      ?.replace(/^pages/, '')
      .replace(/\.mdx?$/, '');

    super(source, path, parentPath);
  }

  async load() {
    const contents = await readFile(this.filePath, 'utf8');

    const slug =
      this.filePath
        .split('/')
        .at(-1)
        ?.replace(/\.mdx?$/, '') ?? '';

    const metaPath = join(
      process.cwd(),
      this.filePath.replace(/[^/]+$/, '_meta.ts'),
    );

    const metaFile = (await import(metaPath)).default;

    const title = parseMetaTitle(metaFile, slug);

    const { checksum, meta, sections } = processMdxForSearch(title, contents);

    this.checksum = checksum;
    this.meta = meta;
    this.sections = sections;

    return {
      checksum,
      meta,
      sections,
    };
  }
}

type EmbeddingSource = MarkdownEmbeddingSource;

async function generateEmbeddings() {
  // @ts-ignore
  const argv = await yargs.option('refresh', {
    alias: 'r',
    description: 'Refresh data',
    type: 'boolean',
  }).argv;

  const shouldRefresh = argv.refresh;

  if (
    !process.env.SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.OPENAI_KEY
  ) {
    return console.info(
      'Environment variables SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and OPENAI_KEY are required: skipping embeddings generation',
    );
  }

  const supabaseClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const embeddingSources: EmbeddingSource[] = [
    ...(await walk('pages'))
      .filter(({ path }) => /\.mdx?$/.test(path))
      .filter(({ path }) => !ignoredFiles.includes(path))
      .map(
        (entry) =>
          new MarkdownEmbeddingSource('guide', entry.path, entry.parentPath),
      ),
  ];

  console.info(`Discovered ${embeddingSources.length} pages`);

  if (!shouldRefresh) {
    console.info('Checking which pages are new or have changed');
  } else console.info('Refresh flag set, re-generating all pages');

  for (const embeddingSource of embeddingSources) {
    const { type, source, path, parentPath } = embeddingSource;

    try {
      const { checksum, meta, sections } = await embeddingSource.load();

      // Check for existing page in DB and compare checksums
      const { error: fetchPageError, data: existingPage } = await supabaseClient
        .from('docs_page')
        .select('id, path, checksum, parentPage:parent_page_id(id, path)')
        .filter('path', 'eq', path)
        .limit(1)
        .maybeSingle();

      if (fetchPageError) {
        throw fetchPageError;
      }

      type ParentPage<T> = T extends any[] ? T[number] | null : T;

      // We use checksum to determine if this page & its sections need to be regenerated
      if (!shouldRefresh && existingPage?.checksum === checksum) {
        const existingParentPage =
          existingPage?.parentPage as unknown as ParentPage<
            typeof existingPage.parentPage
          >;

        // If parent page changed, update it
        if (existingParentPage?.path !== parentPath) {
          console.info(
            `[${path}] Parent page has changed. Updating to '${parentPath}'...`,
          );
          const { error: fetchParentPageError, data: parentPage } =
            await supabaseClient
              .from('docs_page')
              .select()
              .filter('path', 'eq', parentPath)
              .limit(1)
              .maybeSingle();

          if (fetchParentPageError) {
            throw fetchParentPageError;
          }

          const { error: updatePageError } = await supabaseClient
            .from('docs_page')
            .update({ parent_page_id: parentPage?.id })
            .filter('id', 'eq', existingPage.id);

          if (updatePageError) {
            throw updatePageError;
          }
        }
        continue;
      }

      if (existingPage) {
        if (!shouldRefresh) {
          console.info(
            `[${path}] Docs have changed, removing old page sections and their embeddings`,
          );
        } else
          console.info(
            '[$path] Refresh flag set, removing old page sections and their embeddings',
          );

        const { error: deletePageSectionError } = await supabaseClient
          .from('docs_page_section')
          .delete()
          .filter('page_id', 'eq', existingPage.id);

        if (deletePageSectionError) {
          throw deletePageSectionError;
        }
      }

      const { error: fetchParentPageError, data: parentPage } =
        await supabaseClient
          .from('docs_page')
          .select()
          .filter('path', 'eq', parentPath)
          .limit(1)
          .maybeSingle();

      if (fetchParentPageError) {
        throw fetchParentPageError;
      }

      // Create/update page record. Intentionally clear checksum until we
      // have successfully generated all page sections.
      const { error: upsertPageError, data: page } = await supabaseClient
        .from('docs_page')
        .upsert(
          {
            checksum: null,
            path,
            type,
            source,
            meta,
            parent_page_id: parentPage?.id,
          },
          { onConflict: 'path' },
        )
        .select()
        .limit(1)
        .single();

      if (upsertPageError) {
        throw upsertPageError;
      }

      console.info(
        `[${path}] Adding ${sections.length} page sections (with embeddings)`,
      );
      for (const { slug, heading, content } of sections) {
        // OpenAI recommends replacing newlines with spaces for best results (specific to embeddings)
        const input = content.replace(/\n/g, ' ');

        try {
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_KEY,
          });

          const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input,
          });

          const [responseData] = embeddingResponse.data;

          const { error: insertPageSectionError } = await supabaseClient
            .from('docs_page_section')
            .insert({
              page_id: page.id,
              slug,
              heading,
              content,
              token_count: embeddingResponse.usage.total_tokens,
              embedding: responseData.embedding,
            })
            .select()
            .limit(1)
            .single();

          if (insertPageSectionError) {
            throw insertPageSectionError;
          }
        } catch (err) {
          // TODO: decide how to better handle failed embeddings
          console.error(
            `Failed to generate embeddings for '${path}' page section starting with '${input.slice(
              0,
              40,
            )}...'`,
          );

          throw err;
        }
      }

      // Set page checksum so that we know this page was stored successfully
      const { error: updatePageError } = await supabaseClient
        .from('docs_page')
        .update({ checksum })
        .filter('id', 'eq', page.id);

      if (updatePageError) {
        throw updatePageError;
      }
    } catch (err) {
      console.error(
        `Page '${path}' or one/multiple of its page sections failed to store properly. Page has been marked with null checksum to indicate that it needs to be re-generated.`,
      );
      console.error(err);
    }
  }

  console.info('Embedding generation complete');
}

async function main() {
  await generateEmbeddings();
}

main().catch((err) => console.error(err));
