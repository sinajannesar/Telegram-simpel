// src/lib/authOptions.ts - Improved NextAuth configuration
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
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: NextAuthUser | AuthUser }) {
      if (user) {
        const u = user as AuthUser;
        token.userId = u.id;
        token.email = u.email ?? undefined;
        token.name = u.name ?? undefined;
        token.role = u.role;
        
        // Generate JWT token for Socket.IO authentication
        const jwtSecret = process.env.NEXTAUTH_SECRET;
        if (jwtSecret) {
          try {
            // Create a more comprehensive JWT payload
            const jwtPayload = {
              // Standard JWT claims
              sub: u.id, // Subject (user ID)
              iat: Math.floor(Date.now() / 1000), // Issued at
              exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // Expires in 24 hours
              iss: 'your-app-name', // Issuer
              aud: 'socket-io', // Audience
              
              // Custom claims
              userId: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              
              // Add session identifier
              sessionId: `session_${u.id}_${Date.now()}`
            };

            token.accessToken = jwt.sign(jwtPayload, jwtSecret, {
              algorithm: 'HS256' // Ensure consistent algorithm
            });
            
            console.log('🔐 Generated JWT for user:', u.id);
          } catch (error) {
            console.error('❌ JWT generation error:', error);
          }
        } else {
          console.error('❌ NEXTAUTH_SECRET not found for JWT generation');
        }
      }
      
      // Refresh token if it's close to expiration (optional)
      if (token.accessToken) {
        try {
          const decoded = jwt.decode(token.accessToken) as { exp?: number } | null;
          if (decoded && decoded.exp) {
            const timeUntilExpiry = decoded.exp - Math.floor(Date.now() / 1000);
            // Refresh if less than 1 hour remaining
            if (timeUntilExpiry < 3600 && process.env.NEXTAUTH_SECRET) {
              const jwtPayload = {
                sub: token.userId,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
                iss: 'your-app-name',
                aud: 'socket-io',
                userId: token.userId,
                name: token.name,
                email: token.email,
                role: token.role,
                sessionId: `session_${token.userId}_${Date.now()}`
              };
              
              token.accessToken = jwt.sign(jwtPayload, process.env.NEXTAUTH_SECRET, {
                algorithm: 'HS256'
              });
              
              console.log('🔄 Refreshed JWT for user:', token.userId);
            }
          }
        } catch (error) {
          console.error('❌ JWT refresh error:', error);
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
          try {
            jwt.verify(token.accessToken as string, process.env.NEXTAUTH_SECRET || '');
            session.accessToken = token.accessToken as string;
          } catch (error) {
            console.error('❌ Invalid JWT in session:', error);
          }
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
  debug: process.env.NODE_ENV === 'development', // Enable debug in development
};