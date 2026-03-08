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
    const firstNameInput = this.page.getByPlaceholder("Ava");
    const lastNameInput = this.page.getByPlaceholder("Martinez");
    const orgNameInput = this.page.getByPlaceholder("Glow Studio");
    const emailInput = this.page.getByPlaceholder("owner@glowstudio.com");
    const passwordInput = this.page.getByPlaceholder("Create a secure password");

    await firstNameInput.click();
    await firstNameInput.fill("");
    await firstNameInput.type(input.firstName);

    await lastNameInput.click();
    await lastNameInput.fill("");
    await lastNameInput.type(input.lastName);

    await orgNameInput.click();
    await orgNameInput.fill("");
    await orgNameInput.type(input.orgName);

    await emailInput.click();
    await emailInput.fill("");
    await emailInput.type(input.email);

    await passwordInput.click();
    await passwordInput.fill("");
    await passwordInput.type(input.password);
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
