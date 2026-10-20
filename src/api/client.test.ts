import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server, TEST_API_URL } from '../test/server';
import { ApiError, createApiClient } from './client';

const client = createApiClient(TEST_API_URL);

describe('api client', () => {
  it('joins NestJS validation messages into one error', async () => {
    server.use(
      http.get(`${TEST_API_URL}/notifications/:id`, () =>
        HttpResponse.json({ message: ['a must be a string', 'b is required'] }, { status: 400 }),
      ),
    );

    const error = await client.get('x').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, message: 'a must be a string; b is required' });
  });

  it('falls back to the HTTP status when the body is not JSON', async () => {
    server.use(
      http.get(
        `${TEST_API_URL}/notifications/:id`,
        () => new HttpResponse('oops', { status: 502 }),
      ),
    );

    await expect(client.get('x')).rejects.toMatchObject({ status: 502 });
  });

  it('sends the idempotency key header on create', async () => {
    let received: string | null = null;
    server.use(
      http.post(`${TEST_API_URL}/notifications`, ({ request }) => {
        received = request.headers.get('Idempotency-Key');
        return HttpResponse.json({ id: '1' }, { status: 202 });
      }),
    );

    await client.create('order-123456', {
      channel: 'WEBHOOK',
      recipient: 'https://example.com',
      payload: {},
    });

    expect(received).toBe('order-123456');
  });
});
