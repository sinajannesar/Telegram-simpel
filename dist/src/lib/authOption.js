import CredentialsProvider from 'next-auth/providers/credentials';
import { findUserByCredentials } from '@/lib/mocKData';
import jwt from 'jsonwebtoken';
export const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!(credentials === null || credentials === void 0 ? void 0 : credentials.email) || !(credentials === null || credentials === void 0 ? void 0 : credentials.password)) {
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
                };
            }
        })
    ],
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        async jwt({ token, user }) {
            var _a, _b;
            if (user) {
                const u = user;
                token.userId = u.id;
                token.email = (_a = u.email) !== null && _a !== void 0 ? _a : undefined;
                token.name = (_b = u.name) !== null && _b !== void 0 ? _b : undefined;
                token.role = u.role;
                const jwtSecret = process.env.NEXTAUTH_SECRET;
                if (jwtSecret) {
                    token.accessToken = jwt.sign({
                        userId: u.id,
                        name: u.name,
                        email: u.email,
                        role: u.role
                    }, jwtSecret, { expiresIn: '24h' });
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.userId;
                session.user.name = token.name;
                session.user.email = token.email;
                session.user.role = token.role;
                if (token.accessToken) {
                    session.accessToken = token.accessToken;
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
