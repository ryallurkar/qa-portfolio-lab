/**
 * Test data factories — centralise payload construction and keep test data
 * intent clear. Use these instead of inline object literals in specs.
 *
 * Factories generate INPUT data (request payloads, credentials).
 * They do not create database records — the API does that.
 */

let _counter = 0;

/**
 * Generates a unique message string to prevent data collision across
 * parallel test runs. Counter + timestamp ensures uniqueness even when
 * two calls happen within the same millisecond.
 */
export function uniqueMessage(label = "test kudo"): string {
  return `${label} ${++_counter} — ${Date.now()}`;
}

/**
 * Builds a valid POST /kudos request body.
 * Generates a unique message by default — override any field as needed.
 *
 * @example
 * await request.post(KUDOS_URL, {
 *   headers: authHeaders(token),
 *   data: kudoPayload(bobId),
 * });
 *
 * @example override message
 * data: kudoPayload(bobId, { message: "Known text for assertion" })
 */
export function kudoPayload(
  receiverId: number,
  overrides: Partial<{ message: string }> = {}
): { message: string; receiverId: number } {
  return {
    message: uniqueMessage(),
    receiverId,
    ...overrides,
  };
}

/**
 * Seed users available in every test run.
 * Import from here instead of hardcoding strings in specs.
 *
 * @example
 * const signIn = await request.post(SIGN_IN_URL, {
 *   data: SEED_USERS.bob,
 * });
 */
export const SEED_USERS = {
  alice: { username: "alice", password: "!password123" },
  bob:   { username: "bob",   password: "!password123" },
  carol: { username: "carol", password: "!password123" },
  dave:  { username: "dave",  password: "!password123" },
  eve:   { username: "eve",   password: "!password123" },
} as const;
