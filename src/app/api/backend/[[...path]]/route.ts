import { NextRequest, NextResponse } from 'next/server';

// List of hop-by-hop headers that should not be forwarded
const HOP_BY_HOP_HEADERS = [
  'connection',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
];

/**
 * Forward all requests to the FastAPI backend
 * Supports both GET and POST requests with proper header forwarding
 */
async function handleRequest(request: NextRequest) {
  try {
    // Extract the path from the request URL
    // The path after /api/backend/ is captured in params, but we can also extract it directly
    const url = new URL(request.url);

    // Build the backend URL robustly to avoid double slashes
    const backendBase = process.env.FASTAPI_URL || 'http://localhost:8000';
    const restPath = url.pathname.replace(/^\/api\/backend\/?/, '');
    const baseWithSlash = backendBase.endsWith('/') ? backendBase : `${backendBase}/`;
    const targetUrl = new URL(restPath || '', baseWithSlash);
    targetUrl.search = url.search;

    // Prepare headers to forward
    const forwardHeaders = new Headers();

    // Forward all headers except hop-by-hop headers
    request.headers.forEach((value, key) => {
      if (!HOP_BY_HOP_HEADERS.includes(key.toLowerCase())) {
        forwardHeaders.append(key, value);
      }
    });

    // Set content-type if it's missing
    if (!forwardHeaders.has('content-type')) {
      forwardHeaders.set('content-type', 'application/json');
    }

    // Make the request to the FastAPI backend
    const requestBody =
      request.method === 'GET' || request.method === 'HEAD' ? undefined : (request.body as unknown as BodyInit);

    const response = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: forwardHeaders,
      body: requestBody,
      ...(requestBody && { duplex: 'half' }),
    });

    // Prepare response headers
    const responseHeaders = new Headers();

    // Forward response headers except hop-by-hop headers
    response.headers.forEach((value, key) => {
      if (!HOP_BY_HOP_HEADERS.includes(key.toLowerCase())) {
        responseHeaders.append(key, value);
      }
    });

    // Forward the response with streaming support
    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    // Handle connection errors
    console.error('Backend proxy error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to connect to backend',
        message: errorMessage,
      },
      { status: 503 },
    );
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  // Handle async params in Next.js 15
  await context.params;
  return handleRequest(request);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  // Handle async params in Next.js 15
  await context.params;
  return handleRequest(request);
}
