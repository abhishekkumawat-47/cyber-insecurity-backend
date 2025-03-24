import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

import { validationResult } from "express-validator";



const prisma = new PrismaClient();