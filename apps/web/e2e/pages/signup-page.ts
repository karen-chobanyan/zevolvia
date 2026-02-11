import { expect, type Page } from "@playwright/test";

type SignupInput = {
  firstName: string;
  lastName: string;
  orgName: string;
  email: string;
  password: string;
};

export class SignupPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/signup");
  }

  async expectLoaded() {
    await expect(
      this.page.getByRole("heading", { level: 1, name: "Create your Zevolvia account" }),
    ).toBeVisible();
  }

  async fillForm(input: SignupInput) {
    await this.page.getByPlaceholder("Ava").fill(input.firstName);
    await this.page.getByPlaceholder("Martinez").fill(input.lastName);
    await this.page.getByPlaceholder("Glow Studio").fill(input.orgName);
    await this.page.getByPlaceholder("owner@glowstudio.com").fill(input.email);
    await this.page.getByPlaceholder("Create a secure password").fill(input.password);
  }

  async acceptTerms() {
    await this.page.getByRole("checkbox").check();
  }

  async submit() {
    await this.page.getByRole("button", { name: "Create account" }).click();
  }

  async expectSubmitDisabled() {
    await expect(this.page.getByRole("button", { name: "Create account" })).toBeDisabled();
  }
}
