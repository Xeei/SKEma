import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

async function handler(req: NextRequest) {
	const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

	// Strip /api/proxy prefix → /api/v1
	const path = req.nextUrl.pathname.replace('/api/proxy', '/api/v1');
	const targetUrl = new URL(path, BACKEND_URL);

	// Forward query params
	req.nextUrl.searchParams.forEach((value, key) => {
		targetUrl.searchParams.append(key, value);
	});

	const headers: HeadersInit = {};

	const contentType = req.headers.get('Content-Type');
	if (contentType) {
		headers['Content-Type'] = contentType;
	}

	if (token?.backendToken) {
		headers['Authorization'] = `Bearer ${token.backendToken}`;
	}

	const fetchOptions: RequestInit = {
		method: req.method,
		headers,
	};

	// Attach body for non-GET/HEAD requests
	if (req.method !== 'GET' && req.method !== 'HEAD') {
		if (contentType?.includes('multipart/form-data')) {
			fetchOptions.body = await req.blob();
		} else {
			const body = await req.text();
			if (body) fetchOptions.body = body;
		}
	}

	try {
		const response = await fetch(targetUrl.toString(), fetchOptions);
		const contentType = response.headers.get('Content-Type') || 'application/json';
		const data = await response.arrayBuffer();

		return new NextResponse(data, {
			status: response.status,
			headers: {
				'Content-Type': contentType,
			},
		});
	} catch (error) {
		console.error('Proxy error:', error);
		return new NextResponse(JSON.stringify({ error: 'Proxy request failed' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
