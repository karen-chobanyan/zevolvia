import { expect, type Page } from "@playwright/test";

export class DashboardPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/dashboard");
  }

  async expectLoaded() {
    await expect(
      this.page.getByRole("heading", { level: 1, name: "SalonIQ Dashboard" }),
    ).toBeVisible();
  }

  async expectSummaryVisible() {
    await expect(this.page.getByText("Active team members")).toBeVisible();
    await expect(this.page.getByText("Knowledge files")).toBeVisible();
    await expect(this.page.getByText("Client follow-ups")).toBeVisible();
  }

  async clickLogout() {
    const logoutButton = this.page.getByRole("button", { name: "Log out" });
    await expect(logoutButton).toBeVisible();
    await logoutButton.click({ force: true });
  }

  async openSidebarRoute(name: string) {
    await this.page.getByRole("link", { name }).first().click();
  }
}
