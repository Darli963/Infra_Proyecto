import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

export default prisma;
export { Decimal };
