import "dotenv/config";
import { defineConfig } from "prisma/config";

const getDatabaseUrl = () => {
  let dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.log("[PRISMA] WARNING: DATABASE_URL not found - using placeholder for generate");
    return "postgresql://placeholder:placeholder@localhost:5432/placeholder";
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
