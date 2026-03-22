// reflect-metadata must be imported before any routing-controllers or class-transformer usage
import "reflect-metadata";

import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { useExpressServer } from "routing-controllers";
import { AuthController } from "./controllers/auth.controller";
import { KudosController } from "./controllers/kudos.controller";

const app = express();

// Allow requests from the Vite dev server and any configured frontend origin
app.use(cors());
app.use(express.json());

// Wire up routing-controllers. excludeAllExtraneousValues + strategy "excludeAll"
// ensures class-transformer never leaks fields that aren't explicitly @Expose()-d on DTOs.
useExpressServer(app, {
  controllers: [AuthController, KudosController],
  validation: {
    whitelist: true,
    forbidNonWhitelisted: false,
  },
  plainToClassTransformOptions: {
    strategy: "excludeAll",
  },
  defaultErrorHandler: false,
});

// Centralised error handler — keeps error responses consistent
app.use(
  (
    err: Error & { httpCode?: number; errors?: unknown[] },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const status = err.httpCode ?? 500;
    res.status(status).json({
      message: err.message ?? "Internal server error",
      ...(err.errors ? { errors: err.errors } : {}),
    });
  }
);

const PORT = Number(process.env.API_PORT) || 3022;

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});

export default app;
