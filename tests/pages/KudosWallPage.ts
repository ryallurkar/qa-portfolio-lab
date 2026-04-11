import { Page, Locator } from "@playwright/test";
import { selectors } from "../helpers/selectors";

export class KudosWallPage {
  readonly heading;
  readonly createBtn;
  readonly kudosItems;
  readonly modal;
  readonly deleteBtn;

  // Modal form locators — scoped to the modal so they don't pick up stale elements
  readonly messageInput;
  readonly receiverSelect;
  readonly submitBtn;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole("heading", { name: "Kudos Wall" });
    this.createBtn = page.getByTestId(selectors.createKudosBtn);
    this.kudosItems = page.getByTestId(selectors.kudosItem);
    this.modal = page.getByTestId(selectors.kudosModal);
    this.deleteBtn = page.getByTestId(selectors.deleteKudosBtn);

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

  /** Returns the delete button scoped to a specific kudos list item. */
  getDeleteBtnFor(item: Locator) {
    return item.getByTestId(selectors.deleteKudosBtn);
  }
}
