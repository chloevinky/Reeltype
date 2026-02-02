import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare, hash } from 'bcryptjs';
import { db } from './db';
import { users, sessions } from './db/schema';
import { eq } from 'drizzle-orm';
import { authConfig } from './auth.config';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'PIN',
      credentials: {
        username: { label: 'Username', type: 'text' },
        pin: { label: 'PIN', type: 'password' },
        action: { label: 'Action', type: 'text' }, // 'login' or 'register'
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.pin) {
          return null;
        }

        const username = credentials.username as string;
        const pin = credentials.pin as string;
        const action = credentials.action as string;

        // Validate PIN format (4-6 digits)
        if (!/^\d{4,6}$/.test(pin)) {
          throw new Error('PIN must be 4-6 digits');
        }

        if (action === 'register') {
          // Check if username already exists
          const existingUser = await db.query.users.findFirst({
            where: eq(users.username, username.toLowerCase()),
          });

          if (existingUser) {
            throw new Error('Username already exists');
          }

          // Create new user
          const hashedPin = await hash(pin, 12);
          const [newUser] = await db
            .insert(users)
            .values({
              username: username.toLowerCase(),
              pin: hashedPin,
              name: username,
            })
            .returning();

          return {
            id: newUser.id,
            name: newUser.name,
            username: newUser.username,
          };
        }

        // Login flow
        const user = await db.query.users.findFirst({
          where: eq(users.username, username.toLowerCase()),
        });

        if (!user) {
          throw new Error('Invalid username or PIN');
        }

        const isValid = await compare(pin, user.pin);
        if (!isValid) {
          throw new Error('Invalid username or PIN');
        }

        return {
          id: user.id,
          name: user.name,
          username: user.username,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).username = token.username;
      }
      return session;
    },
  },
});

// Helper function to hash a PIN for manual user creation
export async function hashPin(pin: string): Promise<string> {
  return hash(pin, 12);
}
