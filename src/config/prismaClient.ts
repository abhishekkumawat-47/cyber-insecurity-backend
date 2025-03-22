import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Function to generate an 11-digit unique account number
async function generateUniqueAccountNumber() {
  let accNo;
  let exists = true;

  while (exists) {
    accNo = Math.floor(10000000000 + Math.random() * 90000000000).toString(); // 11-digit number

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

// Middleware to set default account number
prisma.$use(async (params, next) => {
  if (params.model === 'Account' && params.action === 'create' && !params.args.data.accountNumber) {
    params.args.data.accountNumber = await generateUniqueAccountNumber();
  }
  return next(params);
});

export default prisma;
