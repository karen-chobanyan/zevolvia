import { expect, type Page } from "@playwright/test";

export class ChatPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/dashboard/chat");
  }

  async expectLoaded() {
    await expect(this.page.getByRole("heading", { level: 2, name: "AI Chat" })).toBeVisible();
  }

  async expectExistingConversation() {
    await expect(this.page.getByText("Stylist scheduling questions").first()).toBeVisible();
    await expect(
      this.page.getByText("Offer a same-day confirmation text and waitlist backup."),
    ).toBeVisible();
  }

  async sendMessage(text: string) {
    const input = this.page.getByPlaceholder("Ask Zevolvia...");

    await input.click();
    await input.fill("");
    await input.type(text);

    await this.page.locator("button[type='submit']").click();
  }

  async expectAssistantAnswerContains(text: string) {
    await expect(this.page.getByText(text)).toBeVisible();
  }
}
