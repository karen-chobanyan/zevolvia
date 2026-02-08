import { expect, Page } from "@playwright/test";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function waitForPathname(page: Page, pathname: string) {
  const urlMatcher = new RegExp(`${escapeRegex(pathname)}(?:\?.*)?$`);
  await page.waitForURL(urlMatcher);
  await expect(page).toHaveURL(urlMatcher);
}

export async function waitForInteractive(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle");
}
