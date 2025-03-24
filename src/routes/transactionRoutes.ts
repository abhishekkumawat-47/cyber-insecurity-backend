import { PrismaClient } from "@prisma/client";
import express, { Request, Response, NextFunction } from "express";
import { connect } from "http2";

const prisma = new PrismaClient();

const router = express.Router();
router.use(express.json());


router.get("/transactions", async(req: Request, res: Response) => {
   try {
     const trans = await prisma.transaction.findMany();
    res.send(trans)
    
   } catch (error) {
       console.error("Transaction error:", error);
       res.status(500).json({ error: "Internal Server Error" });
    
   }
})     

router.get("/byReceiverAccTransactions/:ReceiverAcc", async(req: Request, res: Response) => {
    

    try {
        const { ReceiverAcc } = req.params;
        if(!ReceiverAcc){
            res.status(400).json({error: "Sender Account Number is required"})
        }
        
    const transaction = await prisma.transaction.findMany({
        where:{receiverAccNo:ReceiverAcc},
        include:{
            senderAccount: true,
            receiverAccount: true,
            loan: true
        }
    })

        res.status(201).json(transaction);
    } catch (error) {
        console.error("Transaction error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }



})


router.get("/byIdTransactions/:id", async(req: Request, res: Response) => {
    

    try {
        const { id } = req.params;
    const transaction = await prisma.transaction.findUnique({
        where:{id},
        include:{
            senderAccount: true,
            receiverAccount: true,
            loan: true
        }
    })

        res.status(201).json(transaction);
    } catch (error) {
        console.error("Transaction error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }



})

router.get("/bySenderAccTransactions/:SenderAcc", async(req: Request, res: Response) => {
    

    try {
        const { SenderAcc } = req.params;
        if(!SenderAcc){
            res.status(400).json({error: "Sender Account Number is required"})
        }
        
    const transaction = await prisma.transaction.findMany({
        where:{senderAccNo:SenderAcc},
        include:{
            senderAccount: true,
            receiverAccount: true,
            loan: true
        }
    })

        res.status(201).json(transaction);
    } catch (error) {
        console.error("Transaction error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }



})


router.post("/transactions", async (req, res) => {
    try {
        const { senderAccNo, receiverAccNo, amount, transactionType, status, category, description} = req.body;

        const newTransaction = await prisma.transaction.create({
            data: {
                senderAccNo,
                receiverAccNo,
                amount,  // Required field
                transactionType, // Required field
                status,  // Required field
                category,
                description,
                loanId: null
            },
        });

        res.status(201).json(newTransaction);
    } catch (error) {
        console.error("Transaction error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});






export default router;