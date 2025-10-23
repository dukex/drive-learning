import { betterAuth } from "better-auth"
import Database from "better-sqlite3"

// Create database instance with proper configuration
const database = new Database("database.sqlite")

export const auth = betterAuth({
  database,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:7777",
  secret: process.env.BETTER_AUTH_SECRET!,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scope: [
        "https://www.googleapis.com/auth/drive.file"
      ],
      accessType: "offline",
      prompt: "consent"
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
  },
})