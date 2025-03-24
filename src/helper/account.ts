import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
// Add TypeScript declaration for the generateUniqueAccountNumber function

export async function generateUniqueAccountNumber(): Promise<string> {
  let accNo: string = '';
  let exists = true;

  while (exists) {
    accNo = Math.floor(10 ** 12 + Math.random() * 9 * 10 ** 12).toString(); // 12-digit number

    // Check if the number already exists
    const existingAccount = await prisma.account.findUnique({
      where: { accNo },
    });

    if (!existingAccount) {
      exists = false;
    }
  }

  return accNo;
}
