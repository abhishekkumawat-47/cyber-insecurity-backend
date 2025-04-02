import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";


interface DecodedToken {
  userId: string;
}


// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
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
    req.user = { id: decoded.userId };
    res.status(200).json(req.user);
    next();
  } catch (error:any) {
    res.status(500).json({ message: error.message });
  }
};
