import {
  JsonController,
  Get,
  Post,
  Delete,
  HttpCode,
  Body,
  Req,
  Param,
  UseBefore,
} from "routing-controllers";
import { PrismaClient, Prisma } from "@prisma/client";
import sanitizeHtml from "sanitize-html";
import { CreateKudosDto } from "../dto/create-kudos.dto";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware";

const prisma = new PrismaClient();

// Reusable select shape that strips passwords from author/receiver objects
const kudosSelect = {
  id: true,
  message: true,
  authorId: true,
  receiverId: true,
  createdAt: true,
  author: { select: { id: true, username: true } },
  receiver: { select: { id: true, username: true } },
} as const;

@JsonController("/kudos")
export class KudosController {
  /**
   * Returns all kudos sorted newest first, with author and receiver objects.
   * No authentication required — the wall is publicly readable.
   */
  @Get("/")
  async list() {
    return prisma.kudos.findMany({
      orderBy: { createdAt: "desc" },
      select: kudosSelect,
    });
  }

  /**
   * Creates a new kudo. The authorId always comes from the JWT — any value
   * supplied in the request body is ignored. The message is sanitized before
   * saving to strip any HTML tags.
   */
  @Post("/")
  @UseBefore(authMiddleware)
  async create(@Body() body: CreateKudosDto, @Req() req: AuthenticatedRequest) {
    const authorId = req.user!.id;
    const sanitizedMessage = sanitizeHtml(body.message, { allowedTags: [] });

    try {
      return await prisma.kudos.create({
        data: {
          message: sanitizedMessage,
          authorId,
          receiverId: body.receiverId,
        },
        select: kudosSelect,
      });
    } catch (err) {
      // Foreign key constraint failure — receiverId does not exist in users table
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2003"
      ) {
        const error = new Error("Receiver not found") as Error & { httpCode?: number };
        error.httpCode = 404;
        throw error;
      }
      throw err;
    }
  }

  /**
   * Deletes a kudo by id. Only the author may delete their own kudo.
   * Returns 204 on success, 403 if the requester is not the author,
   * 404 if the kudo does not exist.
   */
  @Delete("/:id")
  @UseBefore(authMiddleware)
  @HttpCode(204)
  async remove(
    @Param("id") id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const numericId = Number(id);

    const kudo = await prisma.kudos.findUnique({ where: { id: numericId } });

    if (!kudo) {
      const error = new Error("Kudo not found") as Error & { httpCode?: number };
      error.httpCode = 404;
      throw error;
    }

    if (kudo.authorId !== req.user!.id) {
      const error = new Error("Forbidden") as Error & { httpCode?: number };
      error.httpCode = 403;
      throw error;
    }

    await prisma.kudos.delete({ where: { id: numericId } });
  }
}
