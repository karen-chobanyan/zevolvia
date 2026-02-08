import { expect } from "@playwright/test";
import { test } from "../fixtures/test";
import { setupAuthenticatedSession } from "../fixtures/auth";

test.describe("Accessibility smoke", () => {
  test("home page exposes core landmarks and heading", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "The 5-minute SMS booking AI for salons on Vagaro, Fresha, or Boulevard.",
      }),
    ).toBeVisible();

    const snapshot = await page.accessibility.snapshot();
    expect(snapshot).not.toBeNull();
  });

  test("login page exposes form controls for keyboard users", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByPlaceholder("you@saloniq.com")).toBeVisible();
    await expect(page.getByPlaceholder("Enter your password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();

    const snapshot = await page.accessibility.snapshot();
    expect(snapshot).not.toBeNull();
  });

  test("chat page keeps accessible status and heading semantics", async ({ page, apiMock }) => {
    setupAuthenticatedSession(apiMock);

    await page.goto("/dashboard/chat");

    await expect(page.getByRole("heading", { level: 2, name: "AI Chat" })).toBeVisible();
    await expect(page.getByText("Stylist scheduling questions")).toBeVisible();

    const snapshot = await page.accessibility.snapshot({ interestingOnly: true });
    expect(snapshot).not.toBeNull();
  });
});
