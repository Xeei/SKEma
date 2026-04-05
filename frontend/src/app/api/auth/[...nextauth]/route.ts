import { createUser, getUserByEmail } from '@/services/user.service';
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import jwt from 'jsonwebtoken';

const handler = NextAuth({
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID ?? '',
			clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
			authorization: {
				params: {
					prompt: 'consent',
					access_type: 'offline',
					response_type: 'code',
				},
			},
		}),
	],
	session: {
		strategy: 'jwt',
	},
	pages: {
		signIn: '/auth/login',
		error: '/auth/error',
	},
	callbacks: {
		async signIn({ user, account, profile }) {
			if (account?.provider === 'google' && user.email) {
				// Check if the email is allowed:
				// 1. KU email domain (@ku.th)
				// 2. Or listed in ALLOWED_EMAILS env var (comma-separated)
				const email = user.email.toLowerCase();
				const allowedEmails = (process.env.ALLOWED_EMAILS ?? '')
					.split(',')
					.map((e) => e.trim().toLowerCase())
					.filter(Boolean);

				if (!email.endsWith('@ku.th') && !allowedEmails.includes(email)) {
					return '/auth/error?error=EmailNotAllowed';
				}

				try {
					const existingUser = await getUserByEmail(user.email);

					if (!existingUser) {
						const payload = {
							id: user.id || profile?.sub || '',
							email: user.email,
							name: user.name || null,
							role: user.role || null,
						};

						await createUser(payload);
					}
					return true;
				} catch (error) {
					console.error('Error during sign in:', error);
					return false;
				}
			}
			return true;
		},
		async jwt({ token, user, account }) {
			// Initial sign in - generate a JWT for backend auth and fetch userId
			if (account && user && user.email) {
				const dbUser = await getUserByEmail(user.email);
				const userId = dbUser?.id || user.id || token.sub;
				const role = dbUser?.role || user.role || undefined;

				const secret = process.env.NEXTAUTH_SECRET!;
				const backendToken = jwt.sign(
					{
						sub: userId,
						email: user.email,
						name: user.name,
						role: role,
					},
					secret,
					{ expiresIn: '7d' }
				);
				return {
					...token,
					backendToken,
					userId,
					role: role || undefined,
				} as typeof token;
			}
			return token;
		},
		async session({ session, token }) {
			// Send backend token and userId to client
			if (session.user) {
				session.backendToken =
					typeof token.backendToken === 'string' ? token.backendToken : undefined;
				session.userId = typeof token.userId === 'string' ? token.userId : undefined;
				session.role = typeof token.role === 'string' ? token.role : undefined;
				// Set user.id from token
				session.user.id = typeof token.userId === 'string' ? token.userId : token.sub || '';
			}
			return session;
		},
	},
});

export { handler as GET, handler as POST };
