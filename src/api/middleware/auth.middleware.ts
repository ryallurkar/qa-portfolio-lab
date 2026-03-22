import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: { id: number; username: string };
}

/**
 * Verifies the Bearer token in the Authorization header and attaches
 * the decoded payload to req.user. Returns 401 if missing or invalid.
 */
export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env.ACCESS_TOKEN_SECRET as string;

  try {
    const payload = jwt.verify(token, secret) as { id: number; username: string };
    req.user = { id: payload.id, username: payload.username };
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
}
