import express, { Request, Response } from "express";
import { RegisterController, validateRegister } from "../controllers/UserControllers";
import { AddPayee, CheckPayeeName, deletePayee, EditPayee, fetchPayee } from "../helper/payee";

const router = express();

router.use(express.json());

// Schema validation using Zod


// Simple GET for register page
router.get('/auth/login', (req: Request, res: Response) => {
  res.send("Registration Page");
});

// POST endpoint with validation
router.post('/auth/register', validateRegister ,
  async (req: express.Request, res: express.Response):Promise<any> => {
    RegisterController(req, res);});


router.post('/payee/:payerCustomerId', AddPayee);
router.get('/payees/:payerCustomerId', fetchPayee)
router.put('/payee/:payerCustomerId', EditPayee)
router.delete('/payee/:payerCustomerId', deletePayee)
router.get('/payee/name', CheckPayeeName)


export default router;