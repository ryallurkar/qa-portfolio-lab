import fs from "fs";
import path from "path";

export const API_BASE_URL = "http://localhost:3022";

const AUTH_FILE = path.join(__dirname, "../../.auth/user.json");

/**
 * Reads the cached auth token written by global-setup.
 * No additional sign-in call is made — the token is reused across all tests.
 */
export async function getAuthToken(): Promise<string> {
  const raw = fs.readFileSync(AUTH_FILE, "utf-8");
  const state = JSON.parse(raw);
  const entry = state.origins[0].localStorage.find(
    (item: { name: string; value: string }) => item.name === "accessToken"
  );
  if (!entry) throw new Error("accessToken not found in .auth/user.json");
  return entry.value;
}

/**
 * Returns the Authorization header object for a given token.
 */
export function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}
