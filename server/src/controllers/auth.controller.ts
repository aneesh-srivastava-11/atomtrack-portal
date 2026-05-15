import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma.js";
import { AppError, asyncHandler } from "../utils/errors.js";
import { signToken } from "../middleware/auth.middleware.js";

function safeUser(user: { password: string; [key: string]: unknown }) {
  const { password: _password, ...rest } = user;
  return rest;
}

export const register = asyncHandler(async (req, res) => {
  // SECURITY: Only allow whitelisted fields. Role is always EMPLOYEE for self-registration.
  const { name, email, password: rawPassword } = req.body;
  const password = await bcrypt.hash(rawPassword, 10);
  const user = await prisma.user.create({ data: { name, email, password, role: "EMPLOYEE" } });
  const token = signToken(user.id);
  res.status(201).json({ user: safeUser(user), token });
});

export const login = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) throw new AppError("Invalid credentials", 401);
  res.json({ user: safeUser(user), token: signToken(user.id) });
});

export const me = asyncHandler(async (req, res) => res.json({ user: req.user }));

export const logout = asyncHandler(async (_req, res) => res.json({ message: "Logged out" }));
