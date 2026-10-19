import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/data/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { addTokenToSession, addUserToToken } from "@/lib/auth/session";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/ar/login" },
  providers: [Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      accountType: { label: "Account type", type: "text" },
    },
    async authorize(credentials) {
      const email = String(credentials?.email ?? "").trim().toLowerCase();
      const password = String(credentials?.password ?? "");
      if (!email || !password || password.length > 128) return null;
      if (credentials?.accountType === "admin") {
        const admin = await prisma.adminUser.findUnique({ where: { email } });
        if (!admin || admin.role !== "ADMIN" || !await verifyPassword(password, admin.passwordHash)) return null;
        return { id: admin.id, email: admin.email, name: admin.email, role: admin.role };
      }
      const customer = await prisma.customerUser.findUnique({ where: { email } });
      if (!customer || customer.role !== "CUSTOMER" || !await verifyPassword(password, customer.passwordHash)) return null;
      return { id: customer.id, email: customer.email, name: customer.name, role: customer.role };
    },
  })],
  callbacks: {
    async jwt({ token, user }) { return addUserToToken(token, user); },
    async session({ session, token }) { return addTokenToSession(session, token); },
  },
});
