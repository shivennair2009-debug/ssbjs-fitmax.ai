import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const prismaClientSingleton = () => {
    console.log("Initializing PrismaClient with adapter (Prisma 7)...");
    if (!pg) console.error("CRITICAL: pg is undefined");
    if (!PrismaPg) console.error("CRITICAL: PrismaPg is undefined");
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Defined" : "UNDEFINED");
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
};

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
