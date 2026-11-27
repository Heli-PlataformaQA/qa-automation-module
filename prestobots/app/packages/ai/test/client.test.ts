import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod/v4';

import { AiClient, type UsageEntry } from '../src/client.ts';

/** A streamed Messages API reply whose only text is `json`. */
const sseReply = (json: string): Response => {
  const events: [string, unknown][] = [
    [
      'message_start',
      {
        type: 'message_start',
        message: {
          id: 'msg_test',
          type: 'message',
          role: 'assistant',
          model: 'claude-opus-5-5',
          content: [],
          stop_reason: null,
          stop_sequence: null,
          usage: { input_tokens: 100, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
        },
      },
    ],
    ['content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }],
    ['content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: json } }],
    ['content_block_stop', { type: 'content_block_stop', index: 0 }],
    ['message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 20 } }],
    ['message_stop', { type: 'message_stop' }],
  ];
  const body = events.map(([event, data]) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`).join('');
  return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } });
};

describe('AiClient.structured', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('handles large answers (above the SDK non-streaming limit) and records their cost', async () => {
    const fetchMock = vi.fn(async () => sseReply('{"answer":"hola"}'));
    vi.stubGlobal('fetch', fetchMock);
    const recorded: UsageEntry[] = [];
    const client = new AiClient('test-key', { author: 'claude-opus-5-5', judge: 'claude-haiku-5-5' }, {
      assertBudget: () => {},
      record: (entry) => recorded.push(entry),
    });

    const result = await client.structured({
      purpose: 'generate_tests',
      model: 'claude-opus-5-5',
      system: 'Answer in JSON.',
      user: 'Hola',
      schema: z.object({ answer: z.string() }),
      maxTokens: 32_000,
      effort: 'high',
    });

    expect(result).toEqual({ answer: 'hola' });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(recorded).toHaveLength(1);
    expect(recorded[0]).toMatchObject({ purpose: 'generate_tests', inputTokens: 100, outputTokens: 20 });
  });
});
