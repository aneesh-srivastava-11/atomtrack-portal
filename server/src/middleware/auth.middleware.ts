import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../utils/errors.js";
import { requestContext } from "../utils/async-storage.js";

const JWT_SECRET = process.env.JWT_SECRET || "";
if (!JWT_SECRET || JWT_SECRET === "replace_with_a_long_random_secret") {
  if (process.env.NODE_ENV === "production") {
    throw new Error("FATAL: JWT_SECRET is not configured. Set a strong secret in .env");
  }
  console.warn("⚠️  WARNING: Using insecure JWT_SECRET. Set a real secret in .env before deploying.");
}

export function signToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET || "dev_secret_unsafe", { expiresIn: "7d" });
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(new AppError("Unauthorized", 401));

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET || "dev_secret_unsafe") as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return next(new AppError("Unauthorized", 401));

    const { password: _password, ...safeUser } = user;
    req.user = safeUser;
    req.role = user.role;
    
    // Set userId in async local storage so Prisma extension can read it
    requestContext.run({ userId: user.id }, () => {
      next();
    });
  } catch {
    return next(new AppError("Invalid or expired token", 401));
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) return next(new AppError("Forbidden", 403));
    next();
  };
}
