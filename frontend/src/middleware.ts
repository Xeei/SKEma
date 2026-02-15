import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

async function customMiddleware(request: NextRequest) {
	if (request.nextUrl.pathname.startsWith('/api/proxy/')) {
		const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

		const token = await getToken({ req: request });
		console.log('Middleware - Token found:', !!token?.backendToken);

		const path = request.nextUrl.pathname.replace('/api/proxy', '/api/v1');

		const newUrl = new URL(path, backendUrl);
		request.nextUrl.searchParams.forEach((value, key) => {
			newUrl.searchParams.append(key, value);
		});

		const headers: HeadersInit = {};

		// Preserve Content-Type from original request
		const contentType = request.headers.get('Content-Type');
		if (contentType) {
			headers['Content-Type'] = contentType;
		}

		if (token?.backendToken) {
			headers['Authorization'] = `Bearer ${token.backendToken}`;
			console.log('Middleware - Authorization header set');
		} else {
			console.log('Middleware - No token available');
		}

		console.log('Middleware - Proxying to:', newUrl.toString());

		try {
			const fetchOptions: RequestInit = {
				method: request.method,
				headers,
			};

			// Include body for non-GET requests
			if (request.method !== 'GET' && request.method !== 'HEAD') {
				// For multipart/form-data (file uploads), use blob
				if (contentType?.includes('multipart/form-data')) {
					const blob = await request.blob();
					fetchOptions.body = blob;
				} else {
					// For JSON and other content types, use text
					const body = await request.text();
					if (body) {
						fetchOptions.body = body;
					}
				}
			}

			const response = await fetch(newUrl.toString(), fetchOptions);
			const data = await response.text();

			return new NextResponse(data, {
				status: response.status,
				headers: {
					'Content-Type': response.headers.get('Content-Type') || 'application/json',
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

	return NextResponse.next();
}

export default withAuth(customMiddleware, {
	pages: {
		signIn: '/auth/login',
	},
	callbacks: {
		authorized({ req, token }) {
			const { pathname } = req.nextUrl;

			// Allow proxy routes
			if (pathname.startsWith('/api/proxy/')) {
				return true;
			}

			// Allow static files
			if (pathname.match(/\.(png|jpg|jpeg|svg|gif|ico|webp|css|js)$/)) {
				return true;
			}

			// Protect library, finance, community pages
			if (
				pathname.startsWith('/library') ||
				pathname.startsWith('/finance') ||
				pathname.startsWith('/community') ||
				pathname.startsWith('/profile')
			) {
				return !!token;
			}

			return true;
		},
	},
});

export const config = {
	matcher: ['/api/proxy/:path*', '/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
