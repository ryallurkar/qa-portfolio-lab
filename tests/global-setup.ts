import { execSync } from "child_process";
import { request } from "@playwright/test";
import path from "path";
import fs from "fs";

const AUTH_FILE = path.join(__dirname, "../.auth/user.json");

async function globalSetup() {
  // Seed the database so every test run starts from a known state
  execSync("npm run db:seed", { stdio: "inherit" });
  console.log("[setup] database seeded");

  // Sign in as alice and cache the token — tests reuse this rather than
  // signing in individually, which keeps the suite fast and decoupled from
  // the login flow itself.
  const context = await request.newContext();
  const response = await context.post("http://localhost:3022/auth/sign-in", {
    data: { username: "alice", password: "Qk$Dev#Seed9!" },
  });

  if (!response.ok()) {
    throw new Error(`[setup] sign-in failed: ${response.status()}`);
  }

  const { accessToken } = await response.json();

  // Write the token as Playwright localStorage state so the chromium project
  // picks it up automatically for every E2E test.
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  fs.writeFileSync(
    AUTH_FILE,
    JSON.stringify({
      cookies: [],
      origins: [
        {
          origin: "http://localhost:3000",
          localStorage: [
            { name: "accessToken", value: accessToken },
          ],
        },
      ],
    })
  );

  await context.dispose();
  console.log("[setup] auth token cached");
}

export default globalSetup;
