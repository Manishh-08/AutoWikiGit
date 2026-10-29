import "dotenv/config";
import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  trustedOrigins: [
    process.env.FRONTEND_URL ?? "http://localhost:3000",
  ],
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      scopes: ["read:user", "user:email", "repo"],
    },
  },
});