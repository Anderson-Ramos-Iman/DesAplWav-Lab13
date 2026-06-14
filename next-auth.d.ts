import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id?: string;
      authProvider?: string;
    };
  }

  interface User {
    authProvider?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    authProvider?: string;
  }
}
