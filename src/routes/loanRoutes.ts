import { PrismaClient } from "@prisma/client";
import express, { Request, Response, NextFunction } from "express";

const prisma = new PrismaClient();
const router = express.Router();

router.use(express.json());


router.get("/", (req: Request, res: Response) => {
    
    res.send("paise de lawde")

}) 

router.get("/loans", async (req: Request, res: Response, next: NextFunction) => {
    const loans = await prisma.loan.findMany();
    res.json(loans);
})


router.get("/loanbyId/:id", async (req: Request, res: Response, next: NextFunction) => {
    const {id} = req.params;
    const loans = await prisma.loan.findUnique({
        where: {id},
        include:{
            Account:true,
            payments:true
        }
    });
    res.json(loans);
})


router.post("/newLoan", async (req: Request, res: Response) => {
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
            dueAmount
        } = req.body;

        // Basic validation
        if (!accNo || !principalAmount || !term) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Validate dates
        if (!startDate || isNaN(new Date(startDate).getTime())) {
            return res.status(400).json({ error: "Invalid or missing startDate" });
        }
        if (!endDate || isNaN(new Date(endDate).getTime())) {
            return res.status(400).json({ error: "Invalid or missing endDate" });
        }

        // Check if account exists
        const accountExists = await prisma.account.findUnique({
            where: { accNo }
        });

        if (!accountExists) {
            return res.status(400).json({ error: "Account not found" });
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
                dueAmount: dueAmount || principalAmount
            }
        });

        return res.status(201).json(newLoan);
    } catch (error) {
        console.error("Loan creation error:", error instanceof Error ? error.message : String(error));
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;