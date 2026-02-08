import { expect, Page } from "@playwright/test";

export async function waitForPathname(page: Page, pathname: string) {
  await page.waitForURL((url) => url.pathname === pathname);
  await expect
    .poll(() => {
      try {
        return new URL(page.url()).pathname;
      } catch {
        return "";
      }
    })
    .toBe(pathname);
}

export async function waitForInteractive(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle");
}
