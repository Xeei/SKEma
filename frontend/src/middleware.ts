import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

async function customMiddleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Protect /admin — only ADMIN role may access
	if (pathname.startsWith('/admin')) {
		const token = await getToken({ req: request });
		if (!token || token.role !== 'ADMIN') {
			return NextResponse.redirect(new URL('/', request.url));
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
