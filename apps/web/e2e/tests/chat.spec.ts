import { expect } from "@playwright/test";
import { test } from "../fixtures/test";
import { setupAuthenticatedSession } from "../fixtures/auth";
import { ChatPage } from "../pages/chat-page";

test.describe("Chat integration flows", () => {
  test.beforeEach(async ({ apiMock }) => {
    setupAuthenticatedSession(apiMock);
    apiMock.resetChatResponses();
  });

  test("renders existing conversations from API", async ({ page }) => {
    const chatPage = new ChatPage(page);

    await chatPage.goto();
    await chatPage.expectLoaded();
    await chatPage.expectExistingConversation();
  });

  test("shows loading state while sessions are fetching", async ({ page, apiMock }) => {
    const chatPage = new ChatPage(page);
    apiMock.setChatSessionsDelay(1_200);

    await chatPage.goto();

    await expect(page.getByText("Loading chats...")).toBeVisible();
    await chatPage.expectExistingConversation();
  });

  test("shows error fallback when chat API fails", async ({ page, apiMock }) => {
    const chatPage = new ChatPage(page);
    apiMock.failChatSessions("Failed to load chats.");

    await chatPage.goto();

    await expect(page.getByText("Failed to load chats.")).toBeVisible();
  });

  test("submits a message and renders assistant response", async ({ page }) => {
    test.slow();

    const chatPage = new ChatPage(page);

    await chatPage.goto();
    await chatPage.expectLoaded();

    await chatPage.sendMessage("Can we send automated reminders?");

    await chatPage.expectAssistantAnswerContains(
      "Here is a scoped answer based on your salon knowledge base.",
    );
  });
});
