import express, { Request, Response } from "express";
import { LoginController, RegisterController, EditPasswordController, EditUserController} from "../controllers/UserControllers";
import { AddPayee, CheckPayeeName, deletePayee, EditPayee, fetchPayee } from "../helper/payee";
import { isLoggedIn } from "../middleware/IsLoggedIn";

const router = express(); 

router.use(express.json());

router.get("/auth/cookieReturn", isLoggedIn )
router.post('/auth/login', LoginController)
router.post("/auth/register" , RegisterController )
router.put("/auth/updatePassword", EditPasswordController)
router.put("/auth/updateUser", EditUserController)



router.post('/payee/:payerCustomerId', AddPayee);
router.get('/payees/:payerCustomerId', fetchPayee)
router.put('/payee/:payerCustomerId', EditPayee)
router.delete('/payee/:payerCustomerId', deletePayee)
router.post('/payees/name',CheckPayeeName)


export default router;