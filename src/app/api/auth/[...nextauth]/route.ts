import NextAuth, { NextAuthOptions } from "next-auth";

import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [

    CredentialsProvider({
      name: "Guest",
      credentials: {},
      async authorize() {
        return {
          id: "guest",
          name: "Guest User",
          email: "guest@example.com",
          image: null,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session }) {
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
