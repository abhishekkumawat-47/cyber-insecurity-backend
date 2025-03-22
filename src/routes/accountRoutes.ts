import { PrismaClient } from "@prisma/client";
import express from "express";
import { body } from "express-validator";
import * as accountController from "../controllers/accountController";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

app.post(
  "/accounts",
  [
    body("customerId").isUUID(),
    body("ifsc").isString().notEmpty(),
    body("accountType").isIn([
      "SAVINGS",
      "CURRENT",
      "FIXED_DEPOSIT",
      "RECURRING_DEPOSIT",
    ]),
    body("balance").isFloat({ min: 0 }).optional(),
  ],
  accountController.createAccount
);

// GET endpoint to fetch account by ID
app.get("/accounts/:id", accountController.getAccountById);

// GET endpoint to fetch all accounts for a customer
app.get(
  "/customers/:customerId/accounts",
  accountController.getAccountsByCustomerId
);

export default app;
