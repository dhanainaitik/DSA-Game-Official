/**
 * Robust HTTP Response Handler for Compiler & API Integrations.
 *
 * Guarantees that response parsing never throws unhandled syntax errors:
 * - "Unexpected end of JSON input" (empty response body)
 * - "Unexpected token '<' ... is not valid JSON" (HTML error pages)
 * - Network or CORS blocks
 *
 * Distinguishes:
 * - SERVICE_UNAVAILABLE (HTTP 500, 502, 503, 504, cold start / spin-up)
 * - METHOD_NOT_ALLOWED (HTTP 405, request intercepted by static router)
 * - RATE_LIMIT (HTTP 429, API rate limit)
 * - AUTH_ERROR (HTTP 401, 403)
 * - NOT_FOUND (HTTP 404)
 * - INVALID_JSON / HTML_RESPONSE (Unexpected payload format)
 * - SUCCESS (Parsed JSON payload)
 */

export async function safeParseApiResponse(response) {
  if (!response) {
    return {
      ok: false,
      status: 0,
      errorType: 'SERVICE_UNAVAILABLE',
      serviceError: 'No response received from remote server. Verify network connection.',
      data: null,
    };
  }

  const status = response.status || 0;
  let rawText = '';

  try {
    rawText = await response.text();
  } catch (readErr) {
    return {
      ok: false,
      status,
      errorType: 'READ_ERROR',
      serviceError: `Failed to read server response: ${readErr.message}`,
      data: null,
    };
  }

  const trimmed = (rawText || '').trim();
  const contentType = (response.headers?.get?.('content-type') || '').toLowerCase();

  // 1. Handle Empty Response Body
  if (!trimmed) {
    let msg = `Remote server returned an empty response (HTTP ${status}).`;
    let errorType = 'SERVICE_UNAVAILABLE';

    if (status === 405) {
      msg = 'Remote compiler endpoint rejected POST request (HTTP 405 Method Not Allowed). The request may have reached a static host instead of the API server.';
      errorType = 'METHOD_NOT_ALLOWED';
    } else if (status === 429) {
      msg = 'Compiler API rate limit reached (HTTP 429). Please wait a moment before trying again.';
      errorType = 'RATE_LIMIT';
    } else if (status === 502 || status === 503 || status === 504) {
      msg = `Remote compiler service is currently unavailable or restarting (HTTP ${status}). Please retry in a few seconds.`;
      errorType = 'SERVICE_UNAVAILABLE';
    } else if (status === 401 || status === 403) {
      msg = `Authentication failed or access denied (HTTP ${status}).`;
      errorType = 'AUTH_ERROR';
    } else if (status === 404) {
      msg = 'Compiler endpoint not found (HTTP 404). Check backend routing.';
      errorType = 'NOT_FOUND';
    }

    return {
      ok: false,
      status,
      errorType,
      serviceError: msg,
      data: null,
      rawBody: '',
    };
  }

  // 2. Handle HTML Error Pages (e.g. Render 502/503 Bad Gateway, Cloudflare, Vercel)
  if (
    trimmed.startsWith('<!DOCTYPE') ||
    trimmed.startsWith('<html') ||
    trimmed.includes('<body') ||
    contentType.includes('text/html')
  ) {
    const titleMatch = trimmed.match(/<title>([^<]+)<\/title>/i);
    const htmlTitle = titleMatch ? titleMatch[1].trim() : `${status} ${response.statusText || 'Error'}`;

    let msg = `Remote service returned an HTML error page (${htmlTitle}).`;
    let errorType = 'HTML_RESPONSE';

    if (status === 502 || status === 503 || status === 504) {
      msg = `Remote compiler service is temporarily unavailable (HTTP ${status}: ${htmlTitle}). The backend service may be waking up from sleep.`;
      errorType = 'SERVICE_UNAVAILABLE';
    } else if (status === 404) {
      msg = `Compiler endpoint not found (HTTP 404: ${htmlTitle}).`;
      errorType = 'NOT_FOUND';
    } else if (status === 405) {
      msg = `Compiler endpoint rejected POST request (HTTP 405 Method Not Allowed: ${htmlTitle}).`;
      errorType = 'METHOD_NOT_ALLOWED';
    }

    return {
      ok: false,
      status,
      errorType,
      serviceError: msg,
      data: null,
      rawBody: trimmed.slice(0, 500),
    };
  }

  // 3. Attempt JSON parse
  let data;
  try {
    data = JSON.parse(trimmed);
  } catch (parseErr) {
    return {
      ok: false,
      status,
      errorType: 'INVALID_JSON',
      serviceError: `Invalid compiler response (HTTP ${status}): Expected JSON, received malformed output: "${trimmed.slice(0, 120)}"`,
      data: null,
      rawBody: trimmed.slice(0, 500),
    };
  }

  // 4. Handle HTTP Error Statuses with JSON Body (e.g. 400 Bad Request, 429, 500)
  if (!response.ok) {
    const errorMsg = data.error || data.message || `Execution failed on server (HTTP ${status})`;
    let errorType = 'SERVER_ERROR';

    if (status === 401 || status === 403) {
      errorType = 'AUTH_ERROR';
    } else if (status === 429) {
      errorType = 'RATE_LIMIT';
    } else if (status >= 500) {
      errorType = 'SERVICE_UNAVAILABLE';
    }

    return {
      ok: false,
      status,
      errorType,
      serviceError: errorMsg,
      data,
    };
  }

  // 5. Success JSON Response
  return {
    ok: true,
    status,
    errorType: null,
    serviceError: null,
    data,
  };
}

