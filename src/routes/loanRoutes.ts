import { PrismaClient } from "@prisma/client";
import express, { Request, Response, NextFunction } from "express";

const prisma = new PrismaClient();
const router = express.Router();

router.use(express.json());

router.get("/", (req: Request, res: Response) => {
  res.send("paise de lawde");
});

router.get(
  "/loans",
  async (req: Request, res: Response, next: NextFunction) => {
    const loans = await prisma.loan.findMany();
    res.json(loans);
  }
);

router.get(
  "/loanbyId/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const loans = await prisma.loan.findUnique({
      where: { id },
      include: {
        Account: true,
        payments: true,
      },
    });
    res.json(loans);
  }
);

router.post("/newLoan", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      accNo,
      loanType,
      interestRate = 0,
      principalAmount,
      interestAmount = 0,
      term,
      startDate,
      endDate,
      schedule = [],
      dueAmount,
    } = req.body;

    // Basic validation
    if (!accNo || !principalAmount || !term) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Validate dates
    if (!startDate || isNaN(new Date(startDate).getTime())) {
      res.status(400).json({ error: "Invalid or missing startDate" });
      return;
    }
    if (!endDate || isNaN(new Date(endDate).getTime())) {
      res.status(400).json({ error: "Invalid or missing endDate" });
      return;
    }

    // Check if account exists
    const accountExists = await prisma.account.findUnique({
      where: { accNo },
    });

    if (!accountExists) {
      res.status(400).json({ error: "Account not found" });
      return
    }

    const newLoan = await prisma.loan.create({
      data: {
        accNo,
        loanType,
        interestRate,
        principalAmount,
        interestAmount,
        term,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: true, // Default status
        schedule,
        dueAmount: dueAmount || principalAmount,
      },
    });

    res.status(201).json(newLoan);
    return
  } catch (error) {
    console.error(
      "Loan creation error:",
      error instanceof Error ? error.message : String(error)
    );
    res.status(500).json({ error: "Internal server error" });
    return
  }
});

export default router;
