import express, { Request, Response } from "express";
import { LoginController, RegisterController} from "../controllers/UserControllers";
import { AddPayee, deletePayee, EditPayee, fetchPayee } from "../helper/payee";

const router = express.Router(); 

router.use(express.json());


router.post('/auth/login', LoginController)
router.post("/auth/register" , RegisterController )


router.post('/payee/:payerCustomerId', AddPayee);
router.get('/payee/:payerCustomerId', fetchPayee)
router.put('/payee/:payerCustomerId', EditPayee)
router.delete('/payee/:payerCustomerId', deletePayee)


export default router;