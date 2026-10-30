import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001",
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;

