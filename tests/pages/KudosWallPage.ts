import { Page } from "@playwright/test";
import { selectors } from "../helpers/selectors";

export class KudosWallPage {
  readonly heading;
  readonly createBtn;
  readonly kudosItems;
  readonly modal;

  // Modal form locators — scoped to the modal so they don't pick up stale elements
  readonly messageInput;
  readonly receiverSelect;
  readonly submitBtn;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole("heading", { name: "Kudos Wall" });
    this.createBtn = page.getByTestId(selectors.createKudosBtn);
    this.kudosItems = page.getByTestId(selectors.kudosItem);
    this.modal = page.getByTestId(selectors.kudosModal);

    this.messageInput = this.modal.getByTestId(selectors.kudosMessageInput);
    this.receiverSelect = this.modal.getByTestId(selectors.kudosReceiverSelect);
    this.submitBtn = this.modal.getByTestId(selectors.kudosSubmitBtn);
  }

  async goto() {
    await this.page.goto("/kudos");
  }

  async openModal() {
    await this.createBtn.click();
    await this.modal.waitFor({ state: "visible" });
  }
}
