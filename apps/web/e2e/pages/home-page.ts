import { expect, type Page } from "@playwright/test";

export class HomePage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/");
  }

  async expectLoaded() {
    await expect(
      this.page.getByRole("heading", {
        level: 1,
        name: "Your clients text. Zevolvia books. Chairs stay full.",
      }),
    ).toBeVisible();
  }

  async openLoginFromHeader() {
    await this.page
      .locator("nav")
      .getByRole("link", { name: /^sign in$/i })
      .click();
  }

  async openSignupFromHeader() {
    await this.page
      .locator("nav")
      .getByRole("link", { name: /^book demo$/i })
      .click();
  }

  async expectMainLayout() {
    await expect(this.page.getByRole("navigation")).toBeVisible();
    await expect(this.page.getByRole("img", { name: "Zevolvia Logo" }).first()).toBeVisible();
  }
}
