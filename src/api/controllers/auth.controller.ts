import {
  JsonController,
  Post,
  Get,
  Body,
  Req,
  UseBefore,
  HttpError,
} from "routing-controllers";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { SignInDto } from "../dto/sign-in.dto";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware";

const prisma = new PrismaClient();

@JsonController("/auth")
export class AuthController {
  /**
   * Sign in with username + password. Returns a signed JWT on success.
   */
  @Post("/sign-in")
  async signIn(@Body() body: SignInDto) {
    const user = await prisma.user.findUnique({
      where: { username: body.username },
    });

    if (!user) {
      throw new HttpError(403, "Invalid credentials");
    }

    const passwordMatch = await bcrypt.compare(body.password, user.password);
    if (!passwordMatch) {
      throw new HttpError(403, "Invalid credentials");
    }

    const secret = process.env.ACCESS_TOKEN_SECRET as string;
    const accessToken = jwt.sign({ id: user.id, username: user.username }, secret, {
      expiresIn: "8h",
    });

    return { accessToken };
  }

  /**
   * Returns the authenticated user's profile — password field is never included.
   */
  @Get("/me")
  @UseBefore(authMiddleware)
  async me(@Req() req: AuthenticatedRequest) {
    const userId = req.user!.id;

    // Use explicit select to guarantee the password field is never returned
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    });

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    return user;
  }

  /**
   * Returns all users — used to populate the receiver dropdown in the frontend.
   * Password fields are stripped via select.
   */
  @Get("/users")
  @UseBefore(authMiddleware)
  async users() {
    return prisma.user.findMany({
      select: { id: true, username: true },
      orderBy: { username: "asc" },
    });
  }
}
