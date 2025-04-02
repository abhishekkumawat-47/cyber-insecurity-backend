import express, { Request, Response } from "express";
import { LoginController, RegisterController, EditPasswordController, EditUserController} from "../controllers/UserControllers";
import { AddPayee, CheckPayeeName, deletePayee, EditPayee, fetchPayee } from "../helper/payee";

import { exportTransactionHistory } from "../helper/ExportAsPDF";
import { forgotPassword } from "../helper/ForgetPassword";

import { isLoggedIn } from "../middleware/IsLoggedIn";


const router = express(); 

router.use(express.json());

router.get("/auth/cookieReturn", isLoggedIn )
router.post('/auth/login', LoginController)
router.post("/auth/register" , RegisterController )
router.put("/auth/updatePassword", isLoggedIn ,EditPasswordController)
router.put("/auth/updateUser", isLoggedIn ,EditUserController)



router.post('/payee/:payerCustomerId', isLoggedIn ,AddPayee);
router.get('/payees/:payerCustomerId', isLoggedIn, fetchPayee)
router.put('/payee/:payerCustomerId', isLoggedIn, EditPayee)
router.delete('/payee/:payerCustomerId', isLoggedIn, deletePayee)
router.post('/payees/name', isLoggedIn,CheckPayeeName)

router.get('/export-pdf/:accNo', isLoggedIn ,exportTransactionHistory)

router.post('/forgetpassword', isLoggedIn ,forgotPassword)


export default router;