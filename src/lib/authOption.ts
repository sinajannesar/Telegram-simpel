import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { findUserByCredentials } from "@/lib/mocKData";
import jwt from 'jsonwebtoken';

interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string;
  provider?: string;
  token?: string; // اضافه کردن فیلد توکن
}

declare module "next-auth" {
  interface Session {
    user: AuthUser;
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user?: AuthUser;
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
          return null;
        }

        try {
          const user = findUserByCredentials(credentials.email, credentials.password);

          if (!user) {
            return null;
          }

          // تولید خودکار توکن
          const token = jwt.sign(
            {
              userId: user.id,
              email: user.email,
              name: `${user.firstname} ${user.lastname}`,
              role: 'user'
            },
            process.env.NEXTAUTH_SECRET!,
            { expiresIn: '7d' }
          );

          return {
            id: user.id.toString(),
            email: user.email,
            name: `${user.firstname} ${user.lastname}`,
            role: 'user',
            provider: 'credentials',
            token: token
          } as AuthUser;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
        token.accessToken = (user as AuthUser).token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.user) {
        session.user = token.user;
        session.accessToken = token.accessToken;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  secret: process.env.NEXTAUTH_SECRET
};