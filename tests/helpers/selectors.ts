/**
 * Single source of truth for all data-testid values used across the app.
 * Import from here — never hardcode a testid string directly in a test file.
 */
export const selectors = {
  // Login page
  signInPage: "sign-in-page",
  loginForm: "login-form",
  usernameInput: "username-input",
  passwordInput: "password-input",
  loginSubmit: "login-submit",
  loginError: "login-error",

  // Kudos wall
  kudosWallPage: "kudos-wall-page",
  createKudosBtn: "create-kudos-btn",
  kudosModal: "kudos-modal",
  kudosItem: "kudos-item",

  // Give-kudos modal form
  kudosMessageInput: "kudos-message-input",
  kudosReceiverSelect: "kudos-receiver-select",
  kudosSubmitBtn: "kudos-submit-btn",
  kudosCreateError: "kudos-create-error",
  deleteKudosBtn: "delete-kudos-btn",
};
