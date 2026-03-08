import { expect, type Page } from "@playwright/test";

export class DashboardPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/dashboard");
  }

  async expectLoaded() {
    await expect(this.page.getByRole("heading", { level: 2, name: "Smart Pulse" })).toBeVisible();
  }

  async expectSummaryVisible() {
    await expect(this.page.getByText("Revenue")).toBeVisible();
    await expect(this.page.getByText("Recovered")).toBeVisible();
    await expect(this.page.getByText("Follow-ups")).toBeVisible();
    await expect(this.page.getByText("Bookings")).toBeVisible();
  }

  async clickLogout() {
    const userMenuButton = this.page.locator("button.dropdown-toggle").first();
    await expect(userMenuButton).toBeVisible();
    await userMenuButton.click();

    const signOutLink = this.page.getByRole("link", { name: "Sign out" });
    await expect(signOutLink).toBeVisible();
    await signOutLink.click();
  }

  async openSidebarRoute(name: string) {
    await this.page.getByRole("link", { name }).first().click();
  }
}
