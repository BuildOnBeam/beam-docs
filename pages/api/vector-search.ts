import { createClient } from '@supabase/supabase-js';
import { codeBlock, oneLine } from 'common-tags';
import type { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { ApplicationError, UserError } from '../../lib/errors';

export const runtime = 'edge';

export default async function handler(req: NextRequest) {
  try {
    const openAiKey = process.env.OPENAI_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!openAiKey) {
      throw new ApplicationError('Missing environment variable OPENAI_KEY');
    }
    if (!supabaseUrl) {
      throw new ApplicationError('Missing environment variable SUPABASE_URL');
    }
    if (!supabaseServiceKey) {
      throw new ApplicationError('Missing environment variable SUPABASE_SERVICE_ROLE_KEY');
    }

    const requestData = await req.json();

    if (!requestData) {
      throw new UserError('Missing request data');
    }

    const { prompt: query } = requestData;

    if (!query) {
      throw new UserError('Missing query in request data');
    }

    const openai = new OpenAI({ apiKey: openAiKey });
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const sanitizedQuery = query.trim();

    // Moderate the content to comply with OpenAI T&C
    const moderation = await openai.moderations.create({ input: sanitizedQuery });
    const [moderationResult] = moderation.results;

    if (moderationResult.flagged) {
      throw new UserError('Flagged content', {
        flagged: true,
        categories: moderationResult.categories,
      });
    }

    // Create embedding from query.
    // Must use the same model as generate-embeddings.ts (text-embedding-3-small).
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: sanitizedQuery.replaceAll('\n', ' '),
    });

    const [{ embedding }] = embeddingResponse.data;

    const { error: matchError, data: pageSections } = await supabaseClient.rpc(
      'match_page_sections',
      {
        embedding,
        match_threshold: 0.78,
        match_count: 10,
        min_content_length: 50,
      },
    );

    if (matchError) {
      throw new ApplicationError('Failed to match page sections', matchError);
    }

    // Build context string, capped at ~6 000 chars (≈1 500 tokens).
    // Avoids a tokenizer package that would exceed the edge function bundle limit.
    let contextText = '';
    for (const section of pageSections) {
      if (contextText.length + section.content.length > 6000) break;
      contextText += `${section.content.trim()}\n---\n`;
    }

    const prompt = codeBlock`
      ${oneLine`
        You are a very enthusiastic Beam representative who loves
        to help people! Given the following sections from the Beam
        documentation, answer the question using only that information,
        outputted in markdown format. If you are unsure and the answer
        is not explicitly written in the documentation, say
        "Sorry, I don't know how to help with that."
      `}

      Context sections:
      ${contextText}

      Question: """
      ${sanitizedQuery}
      """

      Answer as markdown (including related code snippets if available):
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 512,
      temperature: 0,
      stream: true,
    });

    // Stream plain text back. Compatible with useCompletion from the ai package.
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of completion) {
          const text = chunk.choices[0]?.delta?.content ?? '';
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err: unknown) {
    if (err instanceof UserError) {
      return new Response(
        JSON.stringify({ error: err.message, data: err.data }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }
    if (err instanceof ApplicationError) {
      console.error(`${err.message}: ${JSON.stringify(err.data)}`);
    } else {
      console.error(err);
    }
    return new Response(
      JSON.stringify({ error: 'There was an error processing your request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
