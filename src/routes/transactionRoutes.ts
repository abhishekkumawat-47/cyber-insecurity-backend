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

router.get("/bySenderAccTransactions/:SenderAcc", async(req: Request, res: Response): Promise<void> => {
    

    try {
        const { SenderAcc } = req.params;
        if(!SenderAcc){
            res.status(400).json({error: "Sender Account Number is required"})
            return;
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

router.get("/byUserAcc/:Acc", async (req: Request, res: Response): Promise<void> => {
  try {
    const { Acc } = req.params;
    if (!Acc) {
     res.status(400).json({ error: "Sender Account Number is required" });
     return;
    }

    // Fetch transactions where the user is the sender or receiver
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [{ senderAccNo: Acc }, { receiverAccNo: Acc }],
      },
      include:{
            senderAccount:{
                include:{
                    customer:true,
                }
            },
            receiverAccount:{
                include:{
                    customer:true,
                }
            },
            loan: true
        }
    });

    res.status(200).send(transactions );
  } catch (error) {
    console.error("Transaction error:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});


router.post("/transactions", async (req:Request, res:Response): Promise<void> => {
    try {
        const { senderAccNo, receiverAccNo, amount, transactionType, status, category, description} = req.body;
        
        if(senderAccNo === receiverAccNo){
            res.status(400).send({error: "Sender and Receiver Account Number cannot be the same"})
            return;
        }
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
        
        if(transactionType === "TRANSFER"){
            const sender = await prisma.account.findUnique({
                where:{accNo: senderAccNo}
            })
            const receiver = await prisma.account.findUnique({
                where:{accNo: receiverAccNo}
            })

            if (!sender || !receiver) {
                throw new Error('Sender or receiver account not found');
            }

            const newsender = await prisma.account.update({
                where:{accNo: senderAccNo},
                data:{
                    balance : sender.balance - amount
                }
            })

            const newreceiver = await prisma.account.update({
                where:{accNo: receiverAccNo},
                data:{
                    balance : receiver.balance + amount
                }
            })
        }
        

        res.status(201).json(newTransaction);
    } catch (error) {
        console.error("Transaction error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});






export default router;