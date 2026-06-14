import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcrypt";
import {
  clearLoginAttempts,
  findUserByEmail,
  getLoginAttemptStatus,
  isStillLocked,
  recordFailedLogin,
} from "@/lib/auth-store";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signIn",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";

        if (!email || !password) {
          throw new Error("INVALID_CREDENTIALS");
        }

        const user = await findUserByEmail(email);

        if (!user) {
          await recordFailedLogin(email);
          throw new Error("INVALID_CREDENTIALS");
        }

        const lockStatus = await getLoginAttemptStatus(email);

        if (isStillLocked(lockStatus.lockedUntil)) {
          throw new Error("ACCOUNT_LOCKED");
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatches) {
          const attempt = await recordFailedLogin(email);

          if (isStillLocked(attempt.lockedUntil)) {
            throw new Error("ACCOUNT_LOCKED");
          }

          throw new Error("INVALID_CREDENTIALS");
        }

        await clearLoginAttempts(email);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          authProvider: "credentials",
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.authProvider = user.authProvider ?? token.authProvider;
      }

      if (account?.provider) {
        token.authProvider = account.provider;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.authProvider = token.authProvider;
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
