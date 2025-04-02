import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface DecodedToken {
  userId: string;
  fingerprint: string;
  iat?: number;
  exp?: number;
}

interface RequestWithUser extends Request {
  user?: { id: string };
}

export const isLoggedIn = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
    const currentFingerprint = generateFingerprint(req);

    if (decoded.fingerprint !== currentFingerprint) {
      res.status(401).json({ message: "Invalid session" });
      return;
    }

    const tokenAge = decoded.iat ? Date.now() / 1000 - decoded.iat : 0;
    const tokenExpiryTime = decoded.exp ? decoded.exp - Date.now() / 1000 : 0;

    // Rotate only if the token is close to expiration (e.g., within 30 minutes)
    if (tokenExpiryTime < 1800) {
      await rotateSession(res, decoded.userId, currentFingerprint);
    }

    req.user = { id: decoded.userId };
    // res.status(200).send(req.user);
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({ message: "Session expired, please login again" });
    } else if (error.name === "JsonWebTokenError") {
      res.status(401).json({ message: "Invalid session token" });
    } else {
      res.status(500).json({ message: error.message });
    }
    return;
  }
};

function generateFingerprint(req: Request): string {
  const userAgent = req.headers["user-agent"] || "";
  const ip = req.ip || req.socket.remoteAddress || "";
  const rawFingerprint = `${ip}:${userAgent}`;

  let hash = 0;
  for (let i = 0; i < rawFingerprint.length; i++) {
    const char = rawFingerprint.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return hash.toString();
}

async function rotateSession(
  res: Response,
  userId: string,
  fingerprint: string
): Promise<void> {
  if (!process.env.JWT_SEC) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  const newToken = jwt.sign({ userId, fingerprint }, process.env.JWT_SEC, {
    expiresIn: "12h",
  });

  res.cookie("token", newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 12 * 60 * 60 * 1000,
  });
}

export const CookieSend = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
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
    const currentFingerprint = generateFingerprint(req);

    if (decoded.fingerprint !== currentFingerprint) {
      res.status(401).json({ message: "Invalid session" });
      return;
    }

    const tokenAge = decoded.iat ? Date.now() / 1000 - decoded.iat : 0;
    const tokenExpiryTime = decoded.exp ? decoded.exp - Date.now() / 1000 : 0;

    // Rotate only if the token is close to expiration (e.g., within 30 minutes)
    if (tokenExpiryTime < 1800) {
      await rotateSession(res, decoded.userId, currentFingerprint);
    }

    req.user = { id: decoded.userId };
    res.status(200).send(req.user);
    return;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({ message: "Session expired, please login again" });
    } else if (error.name === "JsonWebTokenError") {
      res.status(401).json({ message: "Invalid session token" });
    } else {
      res.status(500).json({ message: error.message });
    }
    return;
  }
};