import type { NextFunction, Request, Response } from "express";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function errorHandler(error: Error, _req: Request, res: Response, _next: NextFunction) {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  if (process.env.NODE_ENV !== "production") console.error(error);
  res.status(statusCode).json({
    error: {
      message: error.message || "Internal server error",
      statusCode
    }
  });
}
