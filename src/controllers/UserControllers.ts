import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// General JSON schema

interface CustomerBody {
  name: string;
  email: string;
  phone: string;
  password: string;
  dataOfBirth: Date;
  pan: string;
  settingConfig: any;
  address: any[];
}

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(8),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/),
  settingConfig: z.any(),
  address: z.array(z.any()),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const LoginController = async (req: Request, res: Response):Promise<void> => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ errors: parseResult.error.errors });
    return;
  }

  const { email, password } = parseResult.data;

  try {
    const user = await prisma.customer.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      res.status(401).json({ error: "Invalid password" });
      return;
    }

    if (!process.env.SECRET_KEY) {
      throw new Error("SECRET_KEY is not defined");
    }
    const token = jwt.sign({ email }, process.env.SECRET_KEY, {
      expiresIn: "3h",
    });
    res.cookie("token", token, { httpOnly: true });

    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
    return;
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
};

export const RegisterController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ errors: parseResult.error.errors });
    return;
  }
  const {
    name,
    email,
    phone,
    password,
    dateOfBirth,
    pan,
    settingConfig,
    address,
  } = parseResult.data;

  try {
    // Check if user already exists
    const existingUser = await prisma.customer.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({ error: "User with this email already exists" });
      return;
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        address,
        dateOfBirth: new Date(dateOfBirth),
        pan,
        settingConfig,
      },
    });

    if (!process.env.SECRET_KEY) {
      throw new Error("SECRET_KEY is not defined");
    }
    const token = jwt.sign({ email }, process.env.SECRET_KEY, {
      expiresIn: "3h",
    });
    res.cookie("token", token, { httpOnly: true });

    // Don't send password back in the response
    const { password: _, ...userWithoutPassword } = result;
    res.status(201).json(userWithoutPassword);
    return;
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
};
