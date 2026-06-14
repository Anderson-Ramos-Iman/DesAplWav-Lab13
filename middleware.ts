import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/signIn",
  },
  callbacks: {
    authorized: ({ token }) => Boolean(token),
  },
});

export const config = { matcher: ["/dashboard", "/profile"] };
