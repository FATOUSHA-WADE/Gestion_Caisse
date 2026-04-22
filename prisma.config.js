import "dotenv/config";
import { defineConfig } from "prisma/config";

const getDatabaseUrl = () => {
  let dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error("[PRISMA] ERROR: DATABASE_URL not found in environment!");
    const dbEnvVars = Object.keys(process.env).filter(k => k.includes("DB") || k.includes("DATABASE"));
    console.log("[PRISMA] Available DB-related env vars:", dbEnvVars.join(", ") || "none");
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const hostPart = dbUrl.split("@")[1]?.split("/")[0] || "not found";
  console.log("[PRISMA] Database host:", hostPart);

  if (!dbUrl.includes("sslmode=require")) {
    dbUrl += dbUrl.includes("?") ? "&sslmode=require" : "?sslmode=require";
    console.log("[PRISMA] Added sslmode=require");
  }

  return dbUrl;
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: getDatabaseUrl(),
  },
});
