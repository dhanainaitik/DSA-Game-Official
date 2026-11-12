/**
 * Shared CORS configuration for Express HTTP routes, error responses, and Socket.IO.
 * Reads comma-separated origins from ALLOWED_ORIGINS while preserving localhost dev origins.
 * Wildcard origins ('*') are intentionally excluded because credentials are enabled.
 */

const DEFAULT_LOCAL_ORIGINS = [
  'http://localhost:5174',
  'http://localhost:5173',
  'http://localhost:3000',
];

function normalizeOrigin(origin) {
  return String(origin ?? '').trim().replace(/\/+$/, '');
}

function parseAllowedOrigins(
  envValue = process.env.ALLOWED_ORIGINS,
  localDefaults = DEFAULT_LOCAL_ORIGINS
) {
  const configured = String(envValue ?? '')
    .split(',')
    .map(normalizeOrigin)
    .filter((entry) => entry && entry !== '*');

  return Array.from(new Set([...localDefaults.map(normalizeOrigin), ...configured]));
}

function isOriginAllowed(origin, allowedOrigins) {
  // Requests without an Origin header (curl, server-to-server, webhooks) are non-CORS requests.
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  if (!normalized || normalized === '*') return false;
  return allowedOrigins.includes(normalized);
}

function createCorsOriginValidator(allowedOrigins) {
  return function validateOrigin(origin, callback) {
    if (isOriginAllowed(origin, allowedOrigins)) {
      return callback(null, true);
    }

    const err = new Error('Not allowed by CORS');
    err.status = 403;
    err.code = 'CORS_NOT_ALLOWED';
    return callback(err);
  };
}

function applyCorsHeaders(res, origin, allowedOrigins) {
  // Only echo an explicit allowed Origin when credentials are enabled; never emit '*'.
  if (origin && isOriginAllowed(origin, allowedOrigins)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
}

module.exports = {
  DEFAULT_LOCAL_ORIGINS,
  normalizeOrigin,
  parseAllowedOrigins,
  isOriginAllowed,
  createCorsOriginValidator,
  applyCorsHeaders,
};

