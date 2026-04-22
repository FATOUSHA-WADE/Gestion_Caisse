import { PrismaClient } from '@prisma/client';

// Build DATABASE_URL with SSL for production
const getDatabaseUrl = () => {
  let dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error("[DB] DATABASE_URL is NOT SET!");
    console.log("[DB] Looking for DB vars...", Object.keys(process.env).filter(k => k.includes("DB") || k.includes("POSTGRES")).join(", "));
    // Return undefined to trigger Prisma error
    return undefined;
  }
  
  console.log("[DB] DATABASE_URL host:", dbUrl.split("@")[1]?.split("/")[0] || "unknown");
  
  // Add sslmode=require for production PostgreSQL
  if (!dbUrl.includes("sslmode=require")) {
    dbUrl = dbUrl + (dbUrl.includes("?") ? "&sslmode=require" : "?sslmode=require");
    console.log("[DB] Added sslmode=require");
  }
  
  return dbUrl;
};

// Pass URL to PrismaClient
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl()
    }
  },
  log: ['error', 'warn']
});

export default prisma;
