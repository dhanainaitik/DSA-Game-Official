import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeApiBaseUrl, buildApiUrl, apiUrl } from './api.js';

test('normalizeApiBaseUrl strips trailing slashes and whitespace cleanly', () => {
  assert.equal(normalizeApiBaseUrl('https://api.example.com///'), 'https://api.example.com');
  assert.equal(normalizeApiBaseUrl('  https://codo.onrender.com/  '), 'https://codo.onrender.com');
  assert.equal(normalizeApiBaseUrl(undefined), '');
  assert.equal(normalizeApiBaseUrl(''), '');
});

test('buildApiUrl builds full endpoint URLs without duplicating slashes or mutating absolute URLs', () => {
  assert.equal(
    buildApiUrl('https://api.example.com/', '/api/user/me'),
    'https://api.example.com/api/user/me'
  );
  assert.equal(
    buildApiUrl('https://api.example.com', 'api/evaluate'),
    'https://api.example.com/api/evaluate'
  );
  assert.equal(buildApiUrl('', '/api/user/me'), '/api/user/me');
  assert.equal(
    buildApiUrl('https://api.example.com', 'https://other.example.com/hook'),
    'https://other.example.com/hook'
  );
});

test('apiUrl falls back cleanly to path when VITE_API_URL is unset outside Vite', () => {
  assert.equal(apiUrl('/api/battleground/stats'), '/api/battleground/stats');
});

