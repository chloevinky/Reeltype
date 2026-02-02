import type { NextAuthConfig } from 'next-auth';

// Edge-safe config (no database imports) - used by middleware
export const authConfig: NextAuthConfig = {
  providers: [], // Configured in auth.ts with credentials
  pages: {
    signIn: '/',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = 
        nextUrl.pathname.startsWith('/swipe') ||
        nextUrl.pathname.startsWith('/feed') ||
        nextUrl.pathname.startsWith('/friends') ||
        nextUrl.pathname.startsWith('/groups') ||
        nextUrl.pathname.startsWith('/profile') ||
        nextUrl.pathname.startsWith('/tonight');
      
      if (isProtected && !isLoggedIn) {
        return false;
      }
      return true;
    },
  },
};
