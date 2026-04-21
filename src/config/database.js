import { PrismaClient } from '@prisma/client';

// Build DATABASE_URL with SSL for production
const getDatabaseUrl = () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("[DB] DATABASE_URL not set! Check Render environment variables.");
    console.log("[DB] Available env vars:", Object.keys(process.env).filter(k => k.includes("DATABASE") || k.includes("DB")).join(", "));
    return undefined;
  }
  
  const hostPart = dbUrl.split("@")[1]?.split("/")[0] || "unknown";
  console.log("[DB] Database host:", hostPart);
  
  // Add sslmode=require for production PostgreSQL
  if (!dbUrl.includes("sslmode=require")) {
    const newUrl = dbUrl + (dbUrl.includes("?") ? "&sslmode=require" : "?sslmode=require");
    console.log("[DB] Added sslmode=require to DATABASE_URL");
    return newUrl;
  }
  return dbUrl;
};

const prisma = new PrismaClient({
  log: ['error', 'warn']
});

export default prisma;
