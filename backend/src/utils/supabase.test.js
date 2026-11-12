const test = require('node:test');
const assert = require('node:assert/strict');

const supabase = require('./supabase');

test('checkSupabaseHealth reports unconfigured when environment variables are missing or placeholders', async () => {
  const origUrl = process.env.SUPABASE_URL;
  const origKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const res = await supabase.checkSupabaseHealth();
    assert.equal(res.configured, false);
    assert.equal(res.connected, false);
    assert.match(res.error, /not configured/i);
    assert.equal(res.key, undefined);

    process.env.SUPABASE_URL = 'https://placeholder.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'placeholder-key';
    const placeholderRes = await supabase.checkSupabaseHealth();
    assert.equal(placeholderRes.configured, false);
    assert.equal(placeholderRes.connected, false);
  } finally {
    if (origUrl !== undefined) process.env.SUPABASE_URL = origUrl;
    else delete process.env.SUPABASE_URL;
    if (origKey !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = origKey;
    else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
});

test('checkSupabaseHealth validates URL formatting', async () => {
  const origUrl = process.env.SUPABASE_URL;
  const origKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    process.env.SUPABASE_URL = 'invalid-url-no-protocol';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-looking-key-12345';

    const res = await supabase.checkSupabaseHealth();
    assert.equal(res.configured, false);
    assert.equal(res.connected, false);
    assert.match(res.error, /not a valid URL/i);
  } finally {
    if (origUrl !== undefined) process.env.SUPABASE_URL = origUrl;
    else delete process.env.SUPABASE_URL;
    if (origKey !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = origKey;
    else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
});

test('checkSupabaseHealth handles probe responses and timeouts gracefully', async () => {
  const origUrl = process.env.SUPABASE_URL;
  const origKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    process.env.SUPABASE_URL = 'https://mocktest.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key-secret-999';

    // Mock client that simulates successful query
    const origFrom = supabase.from;
    supabase.from = (table) => ({
      select() {
        return {
          limit() {
            return Promise.resolve({ data: [{ id: '123' }], error: null });
          },
        };
      },
    });

    const successRes = await supabase.checkSupabaseHealth();
    assert.equal(successRes.configured, true);
    assert.equal(successRes.connected, true);
    assert.equal(successRes.tableReady, true);
    assert.equal(successRes.host, 'mocktest.supabase.co');
    assert.equal(typeof successRes.latencyMs, 'number');
    assert.equal(JSON.stringify(successRes).includes('mock-service-role-key-secret-999'), false);

    // Mock client that simulates table missing (42P01: Postgres undefined_table)
    supabase.from = () => ({
      select() {
        return {
          limit() {
            return Promise.resolve({ data: null, error: { code: '42P01', message: 'relation does not exist' } });
          },
        };
      },
    });

    const migrationNeededRes = await supabase.checkSupabaseHealth();
    assert.equal(migrationNeededRes.configured, true);
    assert.equal(migrationNeededRes.connected, true);
    assert.equal(migrationNeededRes.tableReady, false);
    assert.match(migrationNeededRes.message, /migration required/i);

    // Mock client that simulates PostgREST PGRST204 schema cache table missing
    supabase.from = () => ({
      select() {
        return {
          limit() {
            return Promise.resolve({
              data: null,
              error: {
                code: 'PGRST204',
                message: "Could not find the table 'public.player_profiles' in the schema cache",
              },
            });
          },
        };
      },
    });

    const pgrstRes = await supabase.checkSupabaseHealth();
    assert.equal(pgrstRes.configured, true);
    assert.equal(pgrstRes.connected, true);
    assert.equal(pgrstRes.tableReady, false);
    assert.match(pgrstRes.message, /migration required/i);

    // Mock client that simulates invalid credentials / 401
    supabase.from = () => ({
      select() {
        return {
          limit() {
            return Promise.resolve({ data: null, error: { message: 'Invalid API key' }, status: 401 });
          },
        };
      },
    });

    const authFailRes = await supabase.checkSupabaseHealth();
    assert.equal(authFailRes.configured, true);
    assert.equal(authFailRes.connected, false);
    assert.equal(authFailRes.status, 401);
    assert.equal(authFailRes.error, 'Invalid API key');

    // Mock client that times out
    supabase.from = () => ({
      select() {
        return {
          limit() {
            return new Promise((resolve) => setTimeout(resolve, 500));
          },
        };
      },
    });

    const timeoutRes = await supabase.checkSupabaseHealth(50);
    assert.equal(timeoutRes.configured, true);
    assert.equal(timeoutRes.connected, false);
    assert.match(timeoutRes.error, /timed out/i);

    supabase.from = origFrom;
  } finally {
    if (origUrl !== undefined) process.env.SUPABASE_URL = origUrl;
    else delete process.env.SUPABASE_URL;
    if (origKey !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = origKey;
    else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
});
