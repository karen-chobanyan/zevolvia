import { test } from "../fixtures/test";
import { setupAuthenticatedSession } from "../fixtures/auth";
import { DashboardPage } from "../pages/dashboard-page";
import { waitForPathname } from "../utils/waits";

test.describe("Dashboard flows", () => {
  test.beforeEach(async ({ apiMock }) => {
    setupAuthenticatedSession(apiMock);
  });

  test("renders API-backed dashboard summary widgets", async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    await dashboardPage.goto();
    await dashboardPage.expectLoaded();
    await dashboardPage.expectSummaryVisible();
  });

  test("navigates between main dashboard routes via sidebar", async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    await dashboardPage.goto();
    await dashboardPage.expectLoaded();

    await dashboardPage.openSidebarRoute("Chat");
    await waitForPathname(page, "/dashboard/chat");
    await page.getByRole("heading", { level: 2, name: "AI Chat" }).waitFor({ state: "visible" });

    await dashboardPage.openSidebarRoute("Dashboard");
    await waitForPathname(page, "/dashboard");
    await dashboardPage.expectLoaded();
  });
});
