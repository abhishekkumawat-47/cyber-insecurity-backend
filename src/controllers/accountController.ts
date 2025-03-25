import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { z } from "zod";
import { validationResult } from "express-validator";

import { generateUniqueAccountNumber } from "../helper/account";

const prisma = new PrismaClient();

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

export const transferBetweenOwnAccounts = async (
  req: Request,
  res: Response
): Promise<any> => {
  // Check express-validator validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Define schema for transfer between own accounts
  const TransferSchema = z.object({
    fromAccountNo: z.string().min(1, "Source account number is required"),
    toAccountNo: z.string().min(1, "Destination account number is required"),
    amount: z.number().positive("Transfer amount must be positive"),
    description: z.string().optional(),
  });

  try {
    // Parse and validate request with Zod
    const validatedData = TransferSchema.parse(req.body);
    const {
      fromAccountNo,
      toAccountNo,
      amount,
      description = "Self Transfer",
    } = validatedData;

    // Verify both accounts exist and are active
    const fromAccount = await prisma.account.findUnique({
      where: { accNo: fromAccountNo, status: true },
      include: { customer: true },
    });

    const toAccount = await prisma.account.findUnique({
      where: { accNo: toAccountNo, status: true },
      include: { customer: true },
    });

    // Error handling for accounts
    if (!fromAccount) {
      return res
        .status(404)
        .json({ error: "Source account not found or inactive" });
    }

    if (!toAccount) {
      return res
        .status(404)
        .json({ error: "Destination account not found or inactive" });
    }

    // Check if both accounts belong to the same customer
    if (fromAccount.customerId !== toAccount.customerId) {
      return res.status(403).json({
        error:
          "Transfer only allowed between accounts owned by the same customer",
      });
    }

    // Check sufficient balance
    if (fromAccount.balance < amount) {
      return res.status(400).json({ error: "Insufficient funds" });
    }

    // Perform the transfer in a transaction to ensure atomicity
    const transfer = await prisma.$transaction(async (prismaClient) => {
      // Update source account (subtract amount)
      const updatedFromAccount = await prismaClient.account.update({
        where: { accNo: fromAccountNo },
        data: { balance: { decrement: amount } },
      });

      // Update destination account (add amount)
      const updatedToAccount = await prismaClient.account.update({
        where: { accNo: toAccountNo },
        data: { balance: { increment: amount } },
      });

      // Create transaction record
      const transaction = await prismaClient.transaction.create({
        data: {
          transactionType: "TRANSFER",
          senderAccNo: fromAccountNo,
          receiverAccNo: toAccountNo,
          amount,
          status: true,
          category: "SELF_TRANSFER",
          description,
        },
      });

      return {
        transaction,
        fromAccount: updatedFromAccount,
        toAccount: updatedToAccount,
      };
    });

    return res.status(200).json({
      message: "Transfer successful",
      transactionId: transfer.transaction.id,
      fromAccount: {
        accountNumber: transfer.fromAccount.accNo,
        newBalance: transfer.fromAccount.balance,
      },
      toAccount: {
        accountNumber: transfer.toAccount.accNo,
        newBalance: transfer.toAccount.balance,
      },
    });
  } catch (error) {
    console.error("Transfer error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
