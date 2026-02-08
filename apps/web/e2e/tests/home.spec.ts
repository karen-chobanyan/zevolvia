import { test, expect } from "../fixtures/test";
import { HomePage } from "../pages/home-page";
import { LoginPage } from "../pages/login-page";
import { SignupPage } from "../pages/signup-page";
import { waitForPathname } from "../utils/waits";

test.describe("Public app flows", () => {
  test("discovers expected static Next.js routes", async ({ appRoutes }) => {
    expect(appRoutes).toEqual(
      expect.arrayContaining(["/", "/login", "/signup", "/dashboard", "/dashboard/chat"]),
    );
  });

  test("home page loads and renders primary layout", async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.goto();
    await homePage.expectLoaded();
    await homePage.expectMainLayout();
  });

  test("header navigation reaches auth routes", async ({ page }) => {
    const homePage = new HomePage(page);
    const loginPage = new LoginPage(page);
    const signupPage = new SignupPage(page);

    await homePage.goto();
    await homePage.openLoginFromHeader();

    await waitForPathname(page, "/login");
    await loginPage.expectLoaded();

    await loginPage.goToSignup();
    await waitForPathname(page, "/signup");
    await signupPage.expectLoaded();
  });

  test("unknown route shows not found boundary", async ({ page }) => {
    await page.goto("/route-that-does-not-exist");

    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByText("This page could not be found.")).toBeVisible();
  });
});
