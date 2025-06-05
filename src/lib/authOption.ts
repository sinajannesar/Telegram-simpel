// src/lib/authOption.ts

import type { NextAuthOptions, Session, User as NextAuthUser, Account } from 'next-auth'; // Import Session, User (aliased to NextAuthUser to avoid conflict if you have your own User type), and Account
import type { JWT } from 'next-auth/jwt'; // Import JWT
import CredentialsProvider from 'next-auth/providers/credentials';
import { findUserByCredentials } from '@/lib/mocKData'; // Ensure this path is correct

// Your AuthUser interface
interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string;
}

// Your module declarations for next-auth and next-auth/jwt
// (These should remain as you had them, as they augment the base types)
declare module "next-auth" {
  interface Session {
    user: AuthUser; // Your custom user type
    accessToken?: string; // If you plan to add it
  }
  // If your AuthUser is what authorize returns and what you want on the session user
  // you might not need to extend NextAuth's User directly here if AuthUser is self-contained.
  // However, for the `user` param in `jwt` callback, it can be NextAuth's base User or your AuthUser.
  interface User extends AuthUser {}
}

declare module "next-auth/jwt" {
  interface JWT {
    // These are the properties you are adding to the JWT
    userId?: string;
    email?: string;
    name?: string;
    role?: string;
    // user?: AuthUser; // You can also store the whole AuthUser object if preferred
    accessToken?: string;
  }
}

export const authOptions: NextAuthOptions = { // Explicitly type authOptions
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required.');
        }
        const user = findUserByCredentials(credentials.email, credentials.password);
        if (!user) {
          throw new Error('Incorrect email or password.');
        }
        return {
          id: user.id.toString(),
          email: user.email,
          name: `${user.firstname} ${user.lastname}`,
          role: 'user',
        } as AuthUser; // Ensure it returns your AuthUser type or compatible
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    // It's good practice to type all callback parameters
    async jwt({ token, user, account }: { token: JWT; user?: NextAuthUser | AuthUser; account?: Account | null }) {
      // `user` is passed on the first sign-in, when the JWT is created
      if (user) {
        const u = user as AuthUser; // Cast to your AuthUser type
        token.userId = u.id;
        token.email = u.email ?? undefined;
        token.name = u.name ?? undefined;
        token.role = u.role;
      }
      return token;
    },
    // This is line 93 or around it where the error occurs
    async session({ session, token }: { session: Session; token: JWT }) {
      // `session` is the session object NextAuth is building.
      // `token` is the JWT decoded from the cookie (output of the `jwt` callback).
      // Your augmented `Session` type already expects `session.user` to be `AuthUser`.
      if (token && session.user) {
        session.user.id = token.userId as string;
        session.user.name = token.name as string; // Ensure these fields exist on your JWT type
        session.user.email = token.email as string;
        session.user.role = token.role as string;
        // if (token.accessToken) {
        //   session.accessToken = token.accessToken as string;
        // }
      }
      return session; // The session object to be returned to the client
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};