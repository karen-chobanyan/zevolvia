import { expect, test } from "../fixtures/test";
import { setupAuthenticatedSession, setupUnauthenticatedSession } from "../fixtures/auth";
import { DashboardPage } from "../pages/dashboard-page";
import { LoginPage } from "../pages/login-page";
import { SignupPage } from "../pages/signup-page";
import { createE2EUser } from "../utils/test-data";
import { waitForPathname } from "../utils/waits";

test.describe("Authentication flows", () => {
  test("blocks direct access to protected dashboard route when unauthenticated", async ({
    page,
    apiMock,
  }) => {
    setupUnauthenticatedSession(apiMock);

    await page.goto("/dashboard");

    await waitForPathname(page, "/login");
    await page.waitForURL((url) => {
      const next = url.searchParams.get("next");
      return next === "/dashboard";
    });
  });

  test("shows validation and invalid credential errors on login", async ({ page, apiMock }) => {
    setupUnauthenticatedSession(apiMock);
    apiMock.failNextLogin("Invalid email or password");

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.expectLoaded();

    await loginPage.expectSubmitDisabled();
    await loginPage.fillCredentials("bad.user@zevolvia.test", "wrong-password");
    await loginPage.submit();
    await loginPage.expectInvalidCredentialsError();
  });

  test("logs in and redirects to dashboard", async ({ page, apiMock }) => {
    setupUnauthenticatedSession(apiMock);

    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto("/dashboard");
    await loginPage.expectLoaded();
    await loginPage.fillCredentials("owner.e2e@zevolvia.test", "Password123!");
    await loginPage.submit();

    await waitForPathname(page, "/dashboard");
    await dashboardPage.expectLoaded();
    await dashboardPage.expectSummaryVisible();
  });

  test("signup form enforces acceptance and submits successfully", async ({ page, apiMock }) => {
    setupUnauthenticatedSession(apiMock);

    const signupPage = new SignupPage(page);
    const dashboardPage = new DashboardPage(page);

    const user = createE2EUser("signup");

    await signupPage.goto();
    await signupPage.expectLoaded();
    await signupPage.expectSubmitDisabled();

    await signupPage.fillForm(user);
    await signupPage.expectSubmitDisabled();

    await signupPage.acceptTerms();
    await signupPage.submit();

    expect(apiMock.getLastRegisterPayload()).toMatchObject({
      country: user.country,
    });

    await waitForPathname(page, "/dashboard");
    await dashboardPage.expectLoaded();
  });

  test("logout returns user to login page", async ({ page, apiMock }) => {
    setupAuthenticatedSession(apiMock);

    const dashboardPage = new DashboardPage(page);
    const loginPage = new LoginPage(page);

    await dashboardPage.goto();
    await dashboardPage.expectLoaded();

    await dashboardPage.clickLogout();

    await waitForPathname(page, "/login");
    await loginPage.expectLoaded();
  });
});
