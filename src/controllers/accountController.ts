import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { z } from "zod";
import { validationResult } from "express-validator";

import { generateUniqueAccountNumber } from "../helper/account";

const prisma = new PrismaClient();

// const accNo = generateUniqueAccountNumber();
// console.log(accNo);
// Schema validation using Zod
const AccountSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID format"),
  ifsc: z.string().min(1, "IFSC code is required"),
  accountType: z.enum([
    "SAVINGS",
    "CURRENT",
    "FIXED_DEPOSIT",
    "RECURRING_DEPOSIT",
  ]),
  balance: z
    .number()
    .min(0, "Balance must be a non-negative number")
    .default(0),
});

export const createAccount = async (
  req: Request,
  res: Response
): Promise<any> => {
  // Check express-validator validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Parse and validate with Zod
  try {
    AccountSchema.parse(req.body);
  } catch (zodError) {
    return res.status(400).json({ errors: zodError });
  }
  const { customerId, ifsc, accountType, balance = 0 } = req.body;

  try {
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const accNo = await generateUniqueAccountNumber();
    // Create a new account
    const account = await prisma.account.create({
      data: {
        customerId,
        ifsc,
        accountType: accountType || "SAVINGS",
        balance,
        accNo,
      },
    });

    return res.status(201).json(account);
  } catch (error) {
    console.error("Account creation error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAccountById = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { id } = req.params;

  try {
    const account = await prisma.account.findUnique({
      where: { accNo: id },
    });

    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    return res.status(200).json(account);
  } catch (error) {
    console.error("Error fetching account:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAccountsByCustomerId = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { customerId } = req.params;

  try {
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Find all accounts for this customer
    const accounts = await prisma.account.findMany({
      where: {
        customerId,
        status: true, // Only return active accounts
      },
    });

    return res.status(200).json(accounts);
  } catch (error) {
    console.error("Error fetching customer accounts:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
