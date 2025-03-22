import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";
import { z } from "zod";
import { RegisterController, validateRegister } from "../controllers/UserControllers";

const prisma = new PrismaClient();
const router = express.Router();

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

export default router;