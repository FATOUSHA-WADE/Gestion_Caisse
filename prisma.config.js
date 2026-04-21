import "dotenv/config";
import { defineConfig } from "prisma/config";

// Get DATABASE_URL from Render's internal connection string or local env
const getDatabaseUrl = () => {
  let dbUrl = process.env.DATABASE_URL;
  
  // Log database host for debugging (hide password)
  if (dbUrl) {
    const hostPart = dbUrl.split("@")[1]?.split("/")[0] || "not found";
    console.log("[PRISMA] Database host:", hostPart);
  } else {
    console.error("[PRISMA] ERROR: DATABASE_URL not found in environment!");
    console.log("[PRISMA] Available env vars:", Object.keys(process.env).filter(k => k.includes("DB") || k.includes("DATABASE")).join(", ") || "none");
  }
  
  if (!dbUrl) {
    return "";
  }
  
  // Add sslmode=require for Render PostgreSQL if not present
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
