/**
 * MoneyFi AI Proxy — Cloudflare Worker
 * Relays requests from the MoneyFi PWA to the Anthropic API,
 * adding CORS headers so the browser doesn't block the call.
 *
 * SETUP:
 *  1. Go to https://workers.cloudflare.com → Create Worker
 *  2. Paste this entire file, click Deploy
 *  3. Go to Worker Settings → Variables → Add secret:
 *       Name:  ANTHROPIC_API_KEY
 *       Value: your sk-ant-... key
 *  4. Copy your worker URL (e.g. https://moneyfi-ai-proxy.YOUR-NAME.workers.dev)
 *  5. In MoneyFi HTML, replace _AI_PROXY_URL with that URL
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

// Only allow requests from your MoneyFi origin
const ALLOWED_ORIGIN = 'https://pnraghukishore-hub.github.io';

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    // Only accept POST from allowed origin
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
    if (origin !== ALLOWED_ORIGIN) {
      return new Response('Forbidden', { status: 403 });
    }

    // Parse the incoming body (sent by MoneyFi — no API key included)
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Bad request', { status: 400 });
    }

    // Forward to Anthropic, injecting the API key from Worker secret
    const upstream = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();

    return new Response(JSON.stringify(data), {
      status: upstream.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  },
};

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}
