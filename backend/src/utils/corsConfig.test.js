const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const { Duplex } = require('node:stream');

const {
  DEFAULT_LOCAL_ORIGINS,
  parseAllowedOrigins,
  isOriginAllowed,
  createCorsOriginValidator,
  applyCorsHeaders,
} = require('./corsConfig');

function createMockSocket() {
  const chunks = [];
  const socket = new Duplex({
    read() {},
    write(chunk, _encoding, cb) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      cb();
    },
  });
  socket.remoteAddress = '127.0.0.1';
  socket.writable = true;
  socket.destroyed = false;
  socket.cork = () => {};
  socket.uncork = () => {};
  return { socket, chunks };
}

function dispatchToServer(httpServer, requestPath, { method = 'GET', origin } = {}) {
  return new Promise((resolve, reject) => {
    const { socket, chunks } = createMockSocket();
    const req = new http.IncomingMessage(socket);
    req.method = method;
    req.url = requestPath;
    req.headers = { host: 'localhost:3000' };
    if (origin !== undefined) {
      req.headers.origin = origin;
    }

    const res = new http.ServerResponse(req);
    res.assignSocket(socket);

    const finalize = () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      const headerEndIndex = raw.indexOf('\r\n\r\n');
      const body = headerEndIndex >= 0 ? raw.slice(headerEndIndex + 4) : raw;
      resolve({
        status: res.statusCode,
        headers: res.getHeaders(),
        body,
      });
    };

    res.on('finish', finalize);
    res.on('error', reject);

    httpServer.emit('request', req, res);
    req.push(null);
  });
}

test('parseAllowedOrigins preserves localhost defaults and parses comma-separated origins without wildcards', () => {
  const onlyDefaults = parseAllowedOrigins('');
  assert.deepEqual(onlyDefaults, DEFAULT_LOCAL_ORIGINS);

  const combined = parseAllowedOrigins(
    ' https://codo-prod.vercel.app/ , https://codo-git-feat.vercel.app , * , '
  );
  assert.equal(combined.includes('http://localhost:5174'), true);
  assert.equal(combined.includes('http://localhost:5173'), true);
  assert.equal(combined.includes('http://localhost:3000'), true);
  assert.equal(combined.includes('https://codo-prod.vercel.app'), true);
  assert.equal(combined.includes('https://codo-git-feat.vercel.app'), true);
  assert.equal(combined.includes('*'), false);
});

test('isOriginAllowed and createCorsOriginValidator enforce configured origins and deny wildcards', () => {
  const allowed = parseAllowedOrigins('https://codo-prod.vercel.app');
  const validate = createCorsOriginValidator(allowed);

  assert.equal(isOriginAllowed('https://codo-prod.vercel.app', allowed), true);
  assert.equal(isOriginAllowed('https://codo-champ.vercel.app', allowed), true);
  assert.equal(isOriginAllowed('https://codo-preview-123.vercel.app', allowed), true);
  assert.equal(isOriginAllowed('http://localhost:5173', allowed), true);
  assert.equal(isOriginAllowed('https://evil.example.com', allowed), false);
  assert.equal(isOriginAllowed('*', allowed), false);

  validate('https://codo-prod.vercel.app', (err, ok) => {
    assert.equal(err, null);
    assert.equal(ok, true);
  });

  validate('https://evil.example.com', (err) => {
    assert.ok(err instanceof Error);
    assert.equal(err.status, 403);
    assert.equal(err.code, 'CORS_NOT_ALLOWED');
  });
});

test('applyCorsHeaders sets exact allowed origin with credentials and never uses wildcard *', () => {
  const allowed = parseAllowedOrigins('https://codo-prod.vercel.app');

  const createMockRes = () => {
    const store = {};
    return {
      headers: store,
      setHeader(k, v) {
        store[k.toLowerCase()] = v;
      },
    };
  };

  const allowedRes = createMockRes();
  applyCorsHeaders(allowedRes, 'https://codo-prod.vercel.app', allowed);
  assert.equal(allowedRes.headers['access-control-allow-origin'], 'https://codo-prod.vercel.app');
  assert.equal(allowedRes.headers['access-control-allow-credentials'], 'true');

  const noOriginRes = createMockRes();
  applyCorsHeaders(noOriginRes, undefined, allowed);
  assert.equal(noOriginRes.headers['access-control-allow-origin'], undefined);
  assert.equal(noOriginRes.headers['access-control-allow-credentials'], undefined);

  const rejectedRes = createMockRes();
  applyCorsHeaders(rejectedRes, 'https://evil.example.com', allowed);
  assert.equal(rejectedRes.headers['access-control-allow-origin'], undefined);
});

test('server.js HTTP API, error handler, and Socket.IO enforce ALLOWED_ORIGINS consistently', async () => {
  const prevAllowed = process.env.ALLOWED_ORIGINS;
  process.env.ALLOWED_ORIGINS = 'https://prod-app.vercel.app, https://preview-123-app.vercel.app/';

  const serverPath = path.resolve(__dirname, '../server.js');
  delete require.cache[serverPath];
  const { server, io } = require('../server');

  try {
    // Allowed production Vercel origin (verifying /api and /api/health)
    const prodRes = await dispatchToServer(server, '/api', { origin: 'https://prod-app.vercel.app' });
    assert.equal(prodRes.status, 200);
    assert.equal(prodRes.headers['access-control-allow-origin'], 'https://prod-app.vercel.app');
    assert.equal(prodRes.headers['access-control-allow-credentials'], 'true');

    const healthRes = await dispatchToServer(server, '/api/health');
    assert.equal(healthRes.status, 200);
    const parsedHealth = JSON.parse(healthRes.body);
    assert.equal(parsedHealth.service, 'codo-champ-backend');
    assert.ok(parsedHealth.supabase);
    assert.equal(typeof parsedHealth.supabase.configured, 'boolean');
    assert.equal(typeof parsedHealth.supabase.connected, 'boolean');

    // Allowed preview Vercel origin (normalized trailing slash from env)
    const previewRes = await dispatchToServer(server, '/api', { origin: 'https://preview-123-app.vercel.app' });
    assert.equal(previewRes.status, 200);
    assert.equal(previewRes.headers['access-control-allow-origin'], 'https://preview-123-app.vercel.app');

    // Preserved localhost origin
    const localRes = await dispatchToServer(server, '/api', { origin: 'http://localhost:5173' });
    assert.equal(localRes.status, 200);
    assert.equal(localRes.headers['access-control-allow-origin'], 'http://localhost:5173');

    // Preflight OPTIONS
    const preflightRes = await dispatchToServer(server, '/api', {
      method: 'OPTIONS',
      origin: 'https://prod-app.vercel.app',
    });
    assert.equal(preflightRes.status, 204);
    assert.equal(preflightRes.headers['access-control-allow-origin'], 'https://prod-app.vercel.app');

    // Rejected origin -> 403 and no Access-Control-Allow-Origin header
    const rejectedRes = await dispatchToServer(server, '/api', { origin: 'https://evil.example.com' });
    assert.equal(rejectedRes.status, 403);
    assert.equal(rejectedRes.headers['access-control-allow-origin'], undefined);
    assert.match(rejectedRes.body, /CORS_NOT_ALLOWED/);

    // Server-to-server / no-Origin request -> 200 and never emits '*' with credentials
    const noOriginRes = await dispatchToServer(server, '/api');
    assert.equal(noOriginRes.status, 200);
    assert.equal(noOriginRes.headers['access-control-allow-origin'], undefined);

    // Socket.IO polling handshake: allowed origin succeeds with exact origin + credentials
    const ioAllowed = await dispatchToServer(server, '/socket.io/?EIO=4&transport=polling', {
      origin: 'https://prod-app.vercel.app',
    });
    assert.equal(ioAllowed.status, 200);
    assert.equal(ioAllowed.headers['access-control-allow-origin'], 'https://prod-app.vercel.app');
    assert.equal(ioAllowed.headers['access-control-allow-credentials'], 'true');

    // Socket.IO polling handshake: rejected origin fails and omits Access-Control-Allow-Origin
    const ioRejected = await dispatchToServer(server, '/socket.io/?EIO=4&transport=polling', {
      origin: 'https://evil.example.com',
    });
    assert.ok(ioRejected.status >= 400);
    assert.equal(ioRejected.headers['access-control-allow-origin'], undefined);
  } finally {
    io.close();
    if (prevAllowed === undefined) {
      delete process.env.ALLOWED_ORIGINS;
    } else {
      process.env.ALLOWED_ORIGINS = prevAllowed;
    }
    delete require.cache[serverPath];
  }
});
