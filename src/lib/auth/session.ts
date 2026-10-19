import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

export function addUserToToken(token: JWT, user?: User) {
  if (user) {
    token.sub = user.id;
    token.role = user.role;
  }
  return token;
}

export function addTokenToSession(session: Session, token: JWT) {
  if (session.user) {
    session.user.id = token.sub ?? "";
    session.user.role = token.role ?? "CUSTOMER";
  }
  return session;
}
