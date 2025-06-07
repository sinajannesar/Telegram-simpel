// src/lib/authOption.ts
import type { NextAuthOptions, Session, User as NextAuthUser } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { findUserByCredentials } from '@/lib/mocKData';
import jwt from 'jsonwebtoken';

interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string;
}

declare module "next-auth" {
  interface Session {
    user: AuthUser;
    accessToken?: string; 
  }
  // interface User extends AuthUser {}
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    email?: string;
    name?: string;
    role?: string;
    accessToken?: string;
  }
}

export const authOptions: NextAuthOptions = {
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
        } as AuthUser;
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: NextAuthUser | AuthUser }) {
      if (user) {
        const u = user as AuthUser;
        token.userId = u.id;
        token.email = u.email ?? undefined;
        token.name = u.name ?? undefined;
        token.role = u.role;
        
       
        const jwtSecret = process.env.NEXTAUTH_SECRET;
        if (jwtSecret) {
          token.accessToken = jwt.sign(
            {
              userId: u.id,
              name: u.name,
              email: u.email,
              role: u.role
            },
            jwtSecret,
            { expiresIn: '24h' }
          );
        }
      }
      return token;
    },
    
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        session.user.id = token.userId as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
        
        
        if (token.accessToken) {
          session.accessToken = token.accessToken as string;
        }
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};