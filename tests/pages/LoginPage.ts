import { Page } from "@playwright/test";
import { selectors } from "../helpers/selectors";

export class LoginPage {
  readonly container;
  readonly form;
  readonly usernameInput;
  readonly passwordInput;
  readonly submitBtn;
  readonly errorMessage;

  constructor(private readonly page: Page) {
    this.container = page.getByTestId(selectors.signInPage);
    this.form = page.getByTestId(selectors.loginForm);
    this.usernameInput = page.getByTestId(selectors.usernameInput);
    this.passwordInput = page.getByTestId(selectors.passwordInput);
    this.submitBtn = page.getByTestId(selectors.loginSubmit);
    this.errorMessage = page.getByTestId(selectors.loginError);
  }

  async goto() {
    await this.page.goto("/");
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitBtn.click();
  }
}
