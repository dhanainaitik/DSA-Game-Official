const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[Supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. Database calls will fail.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Safe Supabase connectivity and readiness check.
 * Performs a lightweight probe on player_profiles without exposing keys or modifying data.
 */
async function checkSupabaseHealth(timeoutMs = 4000) {
  const rawUrl = process.env.SUPABASE_URL || '';
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const isConfigured = Boolean(
    rawUrl.trim() &&
    rawKey.trim() &&
    !rawUrl.includes('placeholder') &&
    !rawKey.includes('placeholder')
  );

  if (!isConfigured) {
    return {
      configured: false,
      connected: false,
      error: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured',
    };
  }

  let hostname = '';
  try {
    hostname = new URL(rawUrl).hostname;
  } catch {
    return {
      configured: false,
      connected: false,
      error: 'SUPABASE_URL is not a valid URL',
    };
  }

  const start = Date.now();
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Supabase health check timed out')), timeoutMs)
    );

    const queryPromise = supabase
      .from('player_profiles')
      .select('id')
      .limit(1);

    const { error, status } = await Promise.race([queryPromise, timeoutPromise]);
    const latencyMs = Date.now() - start;

    if (error) {
      // 42P01 / PGRST204: relation/table does not exist (migration needed, but connection & auth succeeded)
      const isTableMissing =
        error.code === '42P01' ||
        error.code === 'PGRST204' ||
        (typeof error.message === 'string' && error.message.includes('Could not find the table'));

      if (isTableMissing) {
        return {
          configured: true,
          connected: true,
          tableReady: false,
          host: hostname,
          latencyMs,
          message: 'Connected to Supabase (table player_profiles not found, migration required)',
        };
      }
      return {
        configured: true,
        connected: false,
        host: hostname,
        status: status || 500,
        latencyMs,
        error: error.message || 'Supabase query error',
      };
    }

    return {
      configured: true,
      connected: true,
      tableReady: true,
      host: hostname,
      latencyMs,
      message: 'Supabase connected and reachable',
    };
  } catch (err) {
    return {
      configured: true,
      connected: false,
      host: hostname,
      latencyMs: Date.now() - start,
      error: err.message || 'Failed to connect to Supabase',
    };
  }
}

supabase.checkSupabaseHealth = checkSupabaseHealth;

module.exports = supabase;
