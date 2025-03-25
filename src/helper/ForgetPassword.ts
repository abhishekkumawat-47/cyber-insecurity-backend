import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import  {sendForgotMail } from "../helper/SendMail";

const prisma = new PrismaClient();

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await prisma.customer.findUnique({ where: { email } });

    if (!user) {
      res.status(404).json({ message: "No user found with this email" });
      return;
    }

    const token = jwt.sign({ email }, process.env.FORGOT_SECRET as string, { expiresIn: "5m" });
    await sendForgotMail("SafeXbank - Password Reset", { email, token });

    res.json({ message: "Password reset link sent to your email" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send reset password email", error });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;
    const decoded = jwt.verify(token, process.env.FORGOT_SECRET as string) as any;

    const user = await prisma.customer.findUnique({ where: { email: decoded.email } });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.customer.update({ where: { email: decoded.email }, data: { password: hashedPassword } });

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Password reset failed", error });
  }
};
