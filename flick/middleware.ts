import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // Match all protected routes
  matcher: [
    '/swipe/:path*',
    '/feed/:path*',
    '/friends/:path*',
    '/groups/:path*',
    '/profile/:path*',
    '/tonight/:path*',
  ],
};
