import { expect, type Page } from "@playwright/test";

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto(nextPath?: string) {
    const target = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";
    await this.page.goto(target);
  }

  async expectLoaded() {
    await expect(this.page.getByRole("heading", { level: 1, name: "Welcome back" })).toBeVisible();
  }

  async fillCredentials(email: string, password: string) {
    await this.page.getByPlaceholder("you@zevolvia.com").fill(email);
    await this.page.getByPlaceholder("Enter your password").fill(password);
  }

  async submit() {
    await this.page.getByRole("button", { name: "Sign in" }).click();
  }

  async expectInvalidCredentialsError() {
    await expect(this.page.getByText("Invalid email or password")).toBeVisible();
  }

  async expectSubmitDisabled() {
    await expect(this.page.getByRole("button", { name: "Sign in" })).toBeDisabled();
  }

  async goToSignup() {
    await this.page.getByRole("link", { name: "Need an account?" }).click();
  }
}
