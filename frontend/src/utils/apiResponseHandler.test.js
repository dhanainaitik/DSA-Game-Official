import test from 'node:test';
import assert from 'node:assert/strict';
import { safeParseApiResponse } from './apiResponseHandler.js';

function mockResponse({ status = 200, statusText = 'OK', text = '', headers = {} }) {
  const headerMap = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    status,
    statusText,
    ok: status >= 200 && status < 300,
    headers: {
      get: (k) => headerMap.get(k.toLowerCase()) || null,
    },
    text: async () => text,
  };
}

test('safeParseApiResponse: handles empty response bodies without throwing Unexpected end of JSON input', async () => {
  // Simulates Vercel 405 empty body
  const res405 = mockResponse({ status: 405, statusText: 'Method Not Allowed', text: '' });
  const parsed405 = await safeParseApiResponse(res405);

  assert.equal(parsed405.ok, false);
  assert.equal(parsed405.status, 405);
  assert.equal(parsed405.errorType, 'METHOD_NOT_ALLOWED');
  assert.ok(parsed405.serviceError.includes('405 Method Not Allowed'));

  // Simulates 503 empty body
  const res503 = mockResponse({ status: 503, statusText: 'Service Unavailable', text: '   ' });
  const parsed503 = await safeParseApiResponse(res503);

  assert.equal(parsed503.ok, false);
  assert.equal(parsed503.status, 503);
  assert.equal(parsed503.errorType, 'SERVICE_UNAVAILABLE');
  assert.ok(parsed503.serviceError.includes('HTTP 503'));
});

test('safeParseApiResponse: handles HTML error pages without throwing SyntaxError: Unexpected token <', async () => {
  const htmlBody = '<!DOCTYPE html><html><head><title>502 Bad Gateway</title></head><body><h1>Bad Gateway</h1></body></html>';
  const res502 = mockResponse({
    status: 502,
    statusText: 'Bad Gateway',
    text: htmlBody,
    headers: { 'Content-Type': 'text/html; charset=UTF-8' },
  });

  const parsed502 = await safeParseApiResponse(res502);
  assert.equal(parsed502.ok, false);
  assert.equal(parsed502.status, 502);
  assert.equal(parsed502.errorType, 'SERVICE_UNAVAILABLE');
  assert.ok(parsed502.serviceError.includes('502 Bad Gateway'));
});

test('safeParseApiResponse: handles HTTP 429 rate limit with descriptive message', async () => {
  const res429 = mockResponse({
    status: 429,
    statusText: 'Too Many Requests',
    text: JSON.stringify({ error: 'Rate limit exceeded: max 10 requests per minute' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const parsed429 = await safeParseApiResponse(res429);
  assert.equal(parsed429.ok, false);
  assert.equal(parsed429.status, 429);
  assert.equal(parsed429.errorType, 'RATE_LIMIT');
  assert.ok(parsed429.serviceError.includes('Rate limit exceeded'));
});

test('safeParseApiResponse: handles HTTP 401/403 authentication/authorization error', async () => {
  const res401 = mockResponse({
    status: 401,
    statusText: 'Unauthorized',
    text: JSON.stringify({ error: 'Invalid or expired token' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const parsed401 = await safeParseApiResponse(res401);
  assert.equal(parsed401.ok, false);
  assert.equal(parsed401.status, 401);
  assert.equal(parsed401.errorType, 'AUTH_ERROR');
  assert.equal(parsed401.serviceError, 'Invalid or expired token');
});

test('safeParseApiResponse: handles malformed JSON without crashing', async () => {
  const resMalformed = mockResponse({
    status: 200,
    text: '{ "partialJson": "value", ',
    headers: { 'Content-Type': 'application/json' },
  });

  const parsed = await safeParseApiResponse(resMalformed);
  assert.equal(parsed.ok, false);
  assert.equal(parsed.errorType, 'INVALID_JSON');
  assert.ok(parsed.serviceError.includes('Expected JSON, received malformed output'));
});

test('safeParseApiResponse: cleanly parses valid execution responses', async () => {
  const payload = {
    success: true,
    passed: true,
    language: 'cpp',
    passedCount: 3,
    totalCount: 3,
    results: [{ caseNumber: 1, passed: true }],
  };

  const res200 = mockResponse({
    status: 200,
    text: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  });

  const parsed = await safeParseApiResponse(res200);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.status, 200);
  assert.equal(parsed.serviceError, null);
  assert.deepEqual(parsed.data, payload);
});

