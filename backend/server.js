const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '..', '.env'),
  quiet: true
});

const PORT = Number(process.env.PORT || 5175);
const HOST = process.env.HOST || '127.0.0.1';
const ROOT = path.resolve(__dirname, '..');
const isVercel = process.env.VERCEL === '1';
const DATA_DIR = isVercel ? '/tmp' : path.join(__dirname, '..', 'backend', 'data');
const PROJECTS_FILE = path.join(__dirname, '..', 'backend', 'data', 'projects.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const DONATIONS_FILE = path.join(DATA_DIR, 'donations.json');
const MAX_BODY_BYTES = 100_000;
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PUBLIC_URL = String(process.env.PUBLIC_URL || '').replace(/\/$/, '');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; ')
};

function withSecurityHeaders(headers = {}) {
  return {
    ...securityHeaders,
    ...headers
  };
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, withSecurityHeaders({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body)
  }));
  res.end(body);
}

function sendText(res, statusCode, message) {
  res.writeHead(statusCode, withSecurityHeaders({
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(message)
  }));
  res.end(message);
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return fallback;
  }
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let receivedBytes = 0;

    req.on('data', chunk => {
      receivedBytes += chunk.length;

      if (receivedBytes > MAX_BODY_BYTES) {
        reject(new Error('Request body is too large.'));
        req.destroy();
        return;
      }

      chunks.push(chunk);
    });

    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function parseBody(rawBody, contentType = '') {
  if (!rawBody) return {};

  if (contentType.includes('application/json')) {
    return JSON.parse(rawBody);
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(rawBody));
  }

  return JSON.parse(rawBody);
}

function cleanText(value, maxLength) {
  return String(value || '')
    .replace(/\0/g, '')
    .trim()
    .slice(0, maxLength);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getPublicOrigin(req) {
  if (PUBLIC_URL) return PUBLIC_URL;

  const forwardedProtocol = cleanText(req.headers['x-forwarded-proto'], 12).split(',')[0];
  const protocol = forwardedProtocol === 'https' ? 'https' : 'http';
  const host = cleanText(req.headers.host, 255);

  if (!/^[a-z0-9.-]+(?::\d{1,5})?$/i.test(host)) {
    return `http://${HOST}:${PORT}`;
  }

  return `${protocol}://${host}`;
}

function paystackRequest(method, apiPath, payload) {
  return new Promise((resolve, reject) => {
    const body = payload ? JSON.stringify(payload) : '';
    const request = https.request({
      hostname: 'api.paystack.co',
      port: 443,
      path: apiPath,
      method,
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        Accept: 'application/json',
        ...(body ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        } : {})
      },
      timeout: 15_000
    }, response => {
      const chunks = [];

      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          if (response.statusCode < 200 || response.statusCode >= 300 || data.status === false) {
            reject(new Error(data.message || 'Paystack rejected the request.'));
            return;
          }
          resolve(data);
        } catch (error) {
          reject(new Error('Paystack returned an invalid response.'));
        }
      });
    });

    request.on('timeout', () => request.destroy(new Error('Paystack took too long to respond.')));
    request.on('error', reject);
    if (body) request.write(body);
    request.end();
  });
}

async function handlePaystackInitialize(req, res) {
  if (!PAYSTACK_SECRET_KEY) {
    sendJson(res, 503, { error: 'Cookie checkout is warming up. Please try again shortly.' });
    return;
  }

  try {
    const rawBody = await collectBody(req);
    const data = parseBody(rawBody, req.headers['content-type'] || '');
    const amount = Number(data.amount);
    const email = cleanText(data.email, 180);
    const name = cleanText(data.name, 120);

    if (!Number.isFinite(amount) || amount < 5 || amount > 100_000) {
      sendJson(res, 400, { error: 'Choose an amount between GH₵5 and GH₵100,000.' });
      return;
    }

    if (!isValidEmail(email)) {
      sendJson(res, 400, { error: 'Enter a valid email for your payment receipt.' });
      return;
    }

    const amountInPesewas = Math.round(amount * 100);
    const reference = `cookie-${crypto.randomUUID()}`;
    const callbackUrl = `${getPublicOrigin(req)}/?cookie=verify`;
    const paystackResponse = await paystackRequest('POST', '/transaction/initialize', {
      email,
      amount: amountInPesewas,
      currency: 'GHS',
      reference,
      callback_url: callbackUrl,
      channels: ['card', 'mobile_money'],
      metadata: {
        purpose: 'Send Ernest a cookie',
        donor_name: name || 'Anonymous supporter'
      }
    });

    sendJson(res, 200, {
      ok: true,
      authorizationUrl: paystackResponse.data.authorization_url,
      reference: paystackResponse.data.reference
    });
  } catch (error) {
    console.error('Paystack initialization error:', error);
    sendJson(res, 502, { error: error.message || 'Unable to start Paystack checkout.' });
  }
}

async function handlePaystackVerify(req, res, requestUrl) {
  if (!PAYSTACK_SECRET_KEY) {
    sendJson(res, 503, { error: 'Cookie checkout is not available yet.' });
    return;
  }

  const reference = cleanText(requestUrl.searchParams.get('reference'), 120);
  if (!/^[a-z0-9._=-]+$/i.test(reference)) {
    sendJson(res, 400, { error: 'That payment reference is invalid.' });
    return;
  }

  try {
    const paystackResponse = await paystackRequest(
      'GET',
      `/transaction/verify/${encodeURIComponent(reference)}`
    );
    const transaction = paystackResponse.data || {};
    const paid = transaction.status === 'success' && transaction.currency === 'GHS';

    if (!paid) {
      sendJson(res, 409, { paid: false, error: 'Payment has not been completed.' });
      return;
    }

    const donations = readJson(DONATIONS_FILE, []);
    if (!donations.some(donation => donation.reference === transaction.reference)) {
      donations.push({
        reference: cleanText(transaction.reference, 120),
        amount: Number(transaction.amount || 0),
        currency: cleanText(transaction.currency, 8),
        channel: cleanText(transaction.channel, 40),
        paidAt: cleanText(transaction.paid_at || transaction.paidAt, 60),
        recordedAt: new Date().toISOString()
      });
      writeJson(DONATIONS_FILE, donations);
    }

    sendJson(res, 200, {
      paid: true,
      amount: Number(transaction.amount || 0) / 100,
      currency: transaction.currency,
      reference: transaction.reference
    });
  } catch (error) {
    console.error('Paystack verification error:', error);
    sendJson(res, 502, { error: error.message || 'Unable to verify this Paystack payment.' });
  }
}

async function handleContact(req, res) {
  try {
    const rawBody = await collectBody(req);
    const data = parseBody(rawBody, req.headers['content-type'] || '');
    const name = cleanText(data.name, 120);
    const email = cleanText(data.email, 180);
    const projectType = cleanText(data.projectType, 120);
    const timeline = cleanText(data.timeline, 120);
    const message = cleanText(data.message, 4000);

    if (name.length < 2) {
      sendJson(res, 400, { error: 'Please enter a valid name.' });
      return;
    }

    if (!isValidEmail(email)) {
      sendJson(res, 400, { error: 'Please enter a valid email address.' });
      return;
    }

    if (message.length < 20) {
      sendJson(res, 400, { error: 'Please share a brief with at least 20 characters.' });
      return;
    }

    const messages = readJson(MESSAGES_FILE, []);
    messages.push({
      id: crypto.randomUUID(),
      name,
      email,
      projectType,
      timeline,
      message,
      createdAt: new Date().toISOString()
    });

    writeJson(MESSAGES_FILE, messages);
    sendJson(res, 201, { ok: true, message: 'Thanks. Your brief has been received.' });
  } catch (error) {
    console.error('Contact form error:', error);
    sendJson(res, 400, { error: 'Unable to process that message.' });
  }
}

function getStaticFilePath(req) {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const vendorFiles = {
      '/vendor/gsap.min.js': path.join(ROOT, 'node_modules', 'gsap', 'dist', 'gsap.min.js'),
      '/vendor/ScrollTrigger.min.js': path.join(ROOT, 'node_modules', 'gsap', 'dist', 'ScrollTrigger.min.js')
    };

    if (vendorFiles[requestUrl.pathname]) {
      return vendorFiles[requestUrl.pathname];
    }

    if (requestUrl.pathname.startsWith('/node_modules/')) {
      return null;
    }

    const pathname = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
    const decodedPath = decodeURIComponent(pathname);
    const pathSegments = decodedPath.split('/').filter(Boolean);

    if (pathSegments.some(segment => segment.startsWith('.'))) {
      return null;
    }

    const filePath = path.resolve(ROOT, `.${decodedPath}`);
    const relativePath = path.relative(ROOT, filePath);

    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      return null;
    }

    return filePath;
  } catch (error) {
    return null;
  }
}

function serveStatic(req, res) {
  const filePath = getStaticFilePath(req);

  if (!filePath) {
    sendText(res, 403, 'Forbidden');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendText(res, 404, 'Not found');
      return;
    }

    const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, withSecurityHeaders({
      'Content-Type': contentType,
      'Content-Length': data.length,
      'Cache-Control': contentType.includes('text/html') ? 'no-store' : 'public, max-age=3600'
    }));
    res.end(req.method === 'HEAD' ? undefined : data);
  });
}

const requestHandler = (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && requestUrl.pathname === '/api/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/projects') {
    sendJson(res, 200, readJson(PROJECTS_FILE, []));
    return;
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/contact') {
    handleContact(req, res);
    return;
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/paystack/initialize') {
    handlePaystackInitialize(req, res);
    return;
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/paystack/verify') {
    handlePaystackVerify(req, res, requestUrl);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  serveStatic(req, res);
};

const server = http.createServer(requestHandler);

if (!isVercel) {
  server.listen(PORT, HOST, () => {
    console.log(`Portfolio server running at http://${HOST}:${PORT}`);
  });
}

module.exports = requestHandler;
