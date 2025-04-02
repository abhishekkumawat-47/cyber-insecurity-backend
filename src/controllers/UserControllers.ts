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
  address: any;
}

const registerSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits long" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  pan: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, { message: "Invalid PAN format" }),
  settingConfig: z.any(),
  address: z.any(),
});

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});

const editUserSchema = z.object({
  id: z.string().uuid({ message: "Invalid user ID" }),
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" })
    .optional(),
  email: z.string().email({ message: "Invalid email address" }).optional(),
  phone: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits long" })
    .optional(),
  dateOfBirth: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    })
    .optional(),
  pan: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, { message: "Invalid PAN format" })
    .optional(),
  settingConfig: z.any().optional(),
  address: z.any().optional(),
});

// Generate a fingerprint for the client based on headers and IP
function generateClientFingerprint(req: Request): string {
  const userAgent = req.headers["user-agent"] || "";
  const ip = req.ip || req.socket.remoteAddress || "";

  // You could add additional client attributes here
  const rawFingerprint = `${ip}:${userAgent}`;

  // Create a simple hash (in production, use a proper hashing function)
  let hash = 0;
  for (let i = 0; i < rawFingerprint.length; i++) {
    const char = rawFingerprint.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return hash.toString();
}

export const CookieReturn = async (
  req: Request,
  res: Response
): Promise<void> => {};

export const LoginController = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log(req.body);

  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errors = parseResult.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    res.status(400).json({ errors });
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

    if (!process.env.JWT_SEC) {
      throw new Error("JWT_SEC is not defined");
    }

    // Generate client fingerprint
    const fingerprint = generateClientFingerprint(req);

    // Create token with user ID and fingerprint
    const token = jwt.sign(
      { userId: user.id, fingerprint },
      process.env.JWT_SEC,
      { expiresIn: "12h" }
    );

    // Set secure cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 12 * 60 * 60 * 1000, // 12 hours
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({ userId: user.id });
  } catch (error) {
    console.error("Login error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

export const RegisterController = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log(req.body);
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errors = parseResult.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    res.status(400).json({ errors });
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

    if (!process.env.JWT_SEC) {
      throw new Error("JWT_SEC is not defined");
    }

    // Generate client fingerprint
    const fingerprint = generateClientFingerprint(req);

    // Create token with user ID and fingerprint
    const token = jwt.sign(
      { userId: result.id, fingerprint },
      process.env.JWT_SEC,
      { expiresIn: "12h" }
    );

    // Set secure cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 12 * 60 * 60 * 1000, // 12 hours
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

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

export const EditUserController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const parseResult = editUserSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errors = parseResult.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    res.status(400).json({ errors });
    return;
  }

  const { id, name, email, phone, dateOfBirth, pan, settingConfig, address } =
    parseResult.data;

  try {
    const updatedUser = await prisma.customer.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        pan,
        settingConfig,
        address,
      },
    });
    // Don't send password back in the response
    const { password: _, ...userWithoutPassword } = updatedUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Error Editing Customer", error);
    res.status(500).json({
      error: "Failed to edit customer",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const EditPasswordController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id, oldPassword, newPassword } = req.body;

    const user = await prisma.customer.findUnique({
      where: { id },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);

    if (!passwordMatch) {
      res.status(401).json({ error: "Invalid password" });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.customer.update({
      where: {
        id, // Ensure we update the correct payee
      },
      data: {
        password: hashedPassword,
      },
    });

    res.status(200).json("updated");
  } catch (error) {
    console.error("Error Editing password", error);
    res.status(500).json({
      error: "Failed to edit password",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};