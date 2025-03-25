import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";


interface DecodedToken {
  userId: string;
}

export const isLoggedIn = (req: Request, res: Response, next: NextFunction): void => {
  try {
  
    const token = req.cookies.token;
    
    if (!token) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!process.env.JWT_SEC) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    const decoded = jwt.verify(token, process.env.JWT_SEC) as DecodedToken;
    console.log(decoded)
    res.status(201).json(decoded.userId)
  } catch (error:any) {
    res.status(500).json({ message: error.message });
  }
};
