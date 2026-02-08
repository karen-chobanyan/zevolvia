import { expect, test as base } from "@playwright/test";
import { discoverStaticAppRoutes } from "../utils/route-discovery";
import { ApiMock } from "../utils/api-mock";

type E2EFixtures = {
  apiMock: ApiMock;
  appRoutes: string[];
};

export const test = base.extend<E2EFixtures>({
  apiMock: [
    async ({ page }, use) => {
      const apiMock = new ApiMock(page);
      await apiMock.install();
      await use(apiMock);
    },
    { auto: true },
  ],
  appRoutes: async ({}, use) => {
    await use(discoverStaticAppRoutes());
  },
});

export { expect };
