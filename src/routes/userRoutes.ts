import express, { Request, Response } from "express";
import { LoginController, RegisterController} from "../controllers/UserControllers";
import { AddPayee, CheckPayeeName, deletePayee, EditPayee, fetchPayee } from "../helper/payee";
import { exportTransactionHistory } from "../helper/ExportAsPDF";
import { forgotPassword } from "../helper/ForgetPassword";

const router = express(); 

router.use(express.json());


router.post('/auth/login', LoginController)
router.post("/auth/register" , RegisterController )


router.post('/payee/:payerCustomerId', AddPayee);
router.get('/payees/:payerCustomerId', fetchPayee)
router.put('/payee/:payerCustomerId', EditPayee)
router.delete('/payee/:payerCustomerId', deletePayee)
router.post('/payees/name',CheckPayeeName)

router.get('/export-pdf/:accNo',exportTransactionHistory)

router.post('/forgetpassword',forgotPassword)


export default router;