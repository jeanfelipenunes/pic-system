import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authenticateLDAP } from "@/lib/ldap";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (user?.senha) {
          const valid = await bcrypt.compare(credentials.password, user.senha);
          if (valid) return { id: user.id, email: user.email, name: user.nome, role: user.role };
        }
        if (process.env.NODE_ENV === "production") {
          const ldapAuth = await authenticateLDAP(credentials.email, credentials.password);
          if (ldapAuth) {
            const ldapUser = await prisma.user.upsert({
              where: { email: credentials.email },
              update: {},
              create: { email: credentials.email, nome: credentials.email.split("@")[0], role: "usuario" },
            });
            return { id: ldapUser.id, email: ldapUser.email, name: ldapUser.nome, role: ldapUser.role };
          }
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; token.role = (user as { role?: string }).role; }
      if (token.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email as string }, select: { id: true, role: true } });
        if (dbUser) { token.id = dbUser.id; token.role = dbUser.role; }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; role?: string }).id = token.id as string;
        (session.user as { id?: string; role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};
