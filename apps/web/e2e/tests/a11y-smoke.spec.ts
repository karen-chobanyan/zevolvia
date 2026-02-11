import { expect } from "@playwright/test";
import { test } from "../fixtures/test";
import { setupAuthenticatedSession } from "../fixtures/auth";

test.describe("Accessibility smoke", () => {
  test("home page exposes core landmarks and heading", async ({ page }) => {
    await page.goto("/");

    const navigation = page.getByRole("navigation").first();
    const main = page.getByRole("main");
    const heroHeading = page.getByRole("heading", {
      level: 1,
      name: "Your clients text. Evolvia books. Chairs stay full.",
    });

    await expect(navigation).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    await expect(heroHeading).toBeVisible();
    await expect(heroHeading).toHaveAccessibleName(
      "Your clients text. Evolvia books. Chairs stay full.",
    );
    await expect(main).toContainText("Book a 10-minute demo");
  });

  test("login page exposes form controls for keyboard users", async ({ page }) => {
    await page.goto("/login");

    const emailField = page.getByPlaceholder("you@zevolvia.com");
    const passwordField = page.getByPlaceholder("Enter your password");
    const submitButton = page.getByRole("button", { name: "Sign in" });

    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
    await expect(submitButton).toBeVisible();
    await expect(emailField).toHaveAccessibleName("you@zevolvia.com");
    await expect(passwordField).toHaveAccessibleName("Enter your password");
    await expect(submitButton).toHaveAccessibleName("Sign in");
  });

  test("chat page keeps accessible status and heading semantics", async ({ page, apiMock }) => {
    setupAuthenticatedSession(apiMock);

    await page.goto("/dashboard/chat");

    const chatHeading = page.getByRole("heading", { level: 2, name: "AI Chat" });
    const chatInput = page.getByPlaceholder("Ask Evolvia...");

    await expect(page.getByRole("heading", { level: 2, name: "AI Chat" })).toBeVisible();
    await expect(chatHeading).toHaveAccessibleName("AI Chat");
    await expect(chatInput).toBeVisible();
    await expect(chatInput).toHaveAccessibleName("Ask Evolvia...");
  });
});
