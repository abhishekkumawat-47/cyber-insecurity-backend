import { PrismaClient } from "@prisma/client";
import  { Request, Response } from "express";
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";
import { z } from "zod";
import jwt from "jsonwebtoken";



const prisma = new PrismaClient();

const CustomerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  phone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  dateOfBirth: z.string().transform((str) => new Date(str)),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format"),
  settingConfig: z.record(z.any()),
});

export const validateRegister = [
    body('name').trim().isLength({ min: 2 }).escape(),
    body('email').isEmail().normalizeEmail(),
    body('phone').isMobilePhone('any'),
    body('password').isLength({ min: 8 }),
    body('dateOfBirth').isISO8601(),
    body('pan').matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/),
  ];


export const RegisterController = async (req: Request, res: Response) => {
      
    // Check express-validator validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Parse and validate with Zod
    try {
      CustomerSchema.parse(req.body);
    } catch (zodError) {
      return res.status(400).json({ errors: zodError });
    }
    
    const { id, name, email, phone, password, dateOfBirth, pan, settingConfig, address } = req.body;

    try {
      // Check if user already exists
      const existingUser = await prisma.customer.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({ error: "User with this email already exists" });
      }

      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Use direct object literal instead of custom interface
      const result = await prisma.customer.create({
        data: {
          id,
          name,
          email,
          phone,
          password: hashedPassword,
          address, // Empty array for address
          dateOfBirth: new Date(dateOfBirth),
          pan,
          settingConfig,
        },
      });

      if (!process.env.SECRET_KEY) {
        throw new Error("SECRET_KEY is not defined");
      }
      const token = jwt.sign({ email }, process.env.SECRET_KEY, { expiresIn: "3h" });
      res.cookie("token", token, { httpOnly: true });

      // Don't send password back in the response
      const { password: _, ...userWithoutPassword } = result;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    

}

