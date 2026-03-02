import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use unpooled/direct URL for migrations (required for Neon)
    // Falls back to DATABASE_URL if DIRECT_DATABASE_URL not set
    url: process.env["DIRECT_DATABASE_URL"] ?? process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"],
  },
});
