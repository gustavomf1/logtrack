import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { readState } from "./store";
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [CredentialsProvider({
    name: "LogTrack",
    credentials: { email: { label: "E-mail", type: "email" }, password: { label: "Senha", type: "password" } },
    async authorize(credentials) {
      if (!credentials?.email || !credentials.password || credentials.password.length > 256) return null;
      const state = await readState();
      const user = state.supervisores.find(x => x.email === credentials.email.trim().toLowerCase());
      // Hash fixo só para equalizar o trabalho de e-mails inexistentes.
      const valid = await compare(credentials.password, user?.senhaHash ?? "$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy");
      return user && valid ? { id: user.id, name: user.nome, email: user.email } : null;
    },
  })],
};
export const session = () => getServerSession(authOptions);
