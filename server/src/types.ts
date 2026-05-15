import type { Role, User } from "@prisma/client";

export type SafeUser = Omit<User, "password">;

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
      role?: Role;
    }
  }
}
