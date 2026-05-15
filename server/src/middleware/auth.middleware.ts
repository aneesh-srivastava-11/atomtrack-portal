import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../utils/errors.js";

export function signToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "dev_secret", { expiresIn: "7d" });
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(new AppError("Unauthorized", 401));

  const token = header.slice(7);
  const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret") as { userId: string };
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) return next(new AppError("Unauthorized", 401));

  const { password: _password, ...safeUser } = user;
  req.user = safeUser;
  req.role = user.role;
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) return next(new AppError("Forbidden", 403));
    next();
  };
}
