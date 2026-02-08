import type { Page, Request, Route } from "@playwright/test";
import {
  buildChatMessages,
  buildChatSessions,
  buildDashboardSummary,
  E2E_ORG_ID,
  E2E_USER,
} from "../fixtures/data";

type AuthState = "authenticated" | "unauthenticated";

type ChatSession = {
  id: string;
  orgId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

type ChatMessage = {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
};

function nowIso() {
  return new Date().toISOString();
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function parseApiPath(url: string) {
  const pathname = new URL(url).pathname;
  const match = pathname.match(/\/api(\/.*)?$/);
  return match?.[1] ?? "/";
}

export class ApiMock {
  private readonly page: Page;

  private authState: AuthState = "unauthenticated";
  private nextLoginErrorMessage: string | null = null;
  private nextRegisterErrorMessage: string | null = null;
  private dashboardErrorMessage: string | null = null;
  private chatListErrorMessage: string | null = null;
  private chatListDelayMs = 0;

  private sessions: ChatSession[] = buildChatSessions();
  private messagesBySession: Record<string, ChatMessage[]> = {
    "session-e2e-001": buildChatMessages(),
  };

  private sessionCounter = 2;
  private messageCounter = 3;

  constructor(page: Page) {
    this.page = page;
  }

  async install() {
    await this.page.route("**/api/**", async (route) => {
      await this.handleApiRoute(route, route.request());
    });
  }

  setAuthenticated(authenticated: boolean) {
    this.authState = authenticated ? "authenticated" : "unauthenticated";
  }

  failNextLogin(message = "Invalid email or password") {
    this.nextLoginErrorMessage = message;
  }

  failNextRegister(message = "Registration failed") {
    this.nextRegisterErrorMessage = message;
  }

  failDashboardSummary(message = "Failed to load dashboard summary") {
    this.dashboardErrorMessage = message;
  }

  failChatSessions(message = "Failed to load chats.") {
    this.chatListErrorMessage = message;
  }

  setChatSessionsDelay(ms: number) {
    this.chatListDelayMs = Math.max(0, ms);
  }

  resetChatResponses() {
    this.chatListErrorMessage = null;
    this.chatListDelayMs = 0;
  }

  private async handleApiRoute(route: Route, request: Request) {
    const method = request.method().toUpperCase();
    const apiPath = parseApiPath(request.url());

    if (method === "POST" && apiPath === "/auth/login") {
      if (this.nextLoginErrorMessage) {
        const message = this.nextLoginErrorMessage;
        this.nextLoginErrorMessage = null;
        await this.fulfillJson(route, 401, { message });
        return;
      }
      this.authState = "authenticated";
      await this.fulfillJson(route, 200, { ok: true });
      return;
    }

    if (method === "POST" && apiPath === "/auth/register") {
      if (this.nextRegisterErrorMessage) {
        const message = this.nextRegisterErrorMessage;
        this.nextRegisterErrorMessage = null;
        await this.fulfillJson(route, 400, { message });
        return;
      }
      this.authState = "authenticated";
      await this.fulfillJson(route, 200, { ok: true });
      return;
    }

    if (method === "GET" && apiPath === "/auth/me") {
      if (this.authState === "unauthenticated") {
        await this.fulfillJson(route, 401, { message: "Unauthorized" });
        return;
      }
      await this.fulfillJson(route, 200, E2E_USER);
      return;
    }

    if (method === "POST" && apiPath === "/auth/logout") {
      this.authState = "unauthenticated";
      await this.fulfillJson(route, 200, { ok: true });
      return;
    }

    if (method === "POST" && apiPath === "/auth/refresh") {
      if (this.authState === "authenticated") {
        await this.fulfillJson(route, 200, { ok: true });
        return;
      }
      await this.fulfillJson(route, 401, { message: "Refresh failed" });
      return;
    }

    if (method === "GET" && apiPath === "/billing/status") {
      await this.fulfillJson(route, 200, {
        subscription: {
          orgId: E2E_ORG_ID,
          status: "ACTIVE",
          trialEnd: null,
        },
      });
      return;
    }

    if (method === "GET" && apiPath === "/dashboard/summary") {
      if (this.authState === "unauthenticated") {
        await this.fulfillJson(route, 401, { message: "Unauthorized" });
        return;
      }
      if (this.dashboardErrorMessage) {
        await this.fulfillJson(route, 500, { message: this.dashboardErrorMessage });
        return;
      }
      await this.fulfillJson(route, 200, buildDashboardSummary());
      return;
    }

    if (method === "GET" && apiPath === "/chat/sessions") {
      if (this.authState === "unauthenticated") {
        await this.fulfillJson(route, 401, { message: "Unauthorized" });
        return;
      }
      if (this.chatListDelayMs > 0) {
        await sleep(this.chatListDelayMs);
      }
      if (this.chatListErrorMessage) {
        await this.fulfillJson(route, 500, { message: this.chatListErrorMessage });
        return;
      }
      await this.fulfillJson(route, 200, this.sessions);
      return;
    }

    if (method === "POST" && apiPath === "/chat/sessions") {
      if (this.authState === "unauthenticated") {
        await this.fulfillJson(route, 401, { message: "Unauthorized" });
        return;
      }

      const createdAt = nowIso();
      const session: ChatSession = {
        id: `session-e2e-${String(this.sessionCounter).padStart(3, "0")}`,
        orgId: E2E_ORG_ID,
        title: "New chat",
        createdAt,
        updatedAt: createdAt,
      };
      this.sessionCounter += 1;
      this.sessions = [session, ...this.sessions];
      this.messagesBySession[session.id] = [];

      await this.fulfillJson(route, 201, session);
      return;
    }

    if (method === "GET" && /^\/chat\/sessions\/[^/]+\/messages$/.test(apiPath)) {
      if (this.authState === "unauthenticated") {
        await this.fulfillJson(route, 401, { message: "Unauthorized" });
        return;
      }

      const sessionId = apiPath.split("/")[3] ?? "";
      const messages = this.messagesBySession[sessionId] ?? [];
      await this.fulfillJson(route, 200, messages);
      return;
    }

    if (method === "POST" && /^\/chat\/sessions\/[^/]+\/ask$/.test(apiPath)) {
      if (this.authState === "unauthenticated") {
        await this.fulfillJson(route, 401, { message: "Unauthorized" });
        return;
      }

      const sessionId = apiPath.split("/")[3] ?? "";
      const body = this.parseJson<{ question?: string; kbOnly?: boolean }>(request.postData());
      const question = body?.question?.trim() || "Test question";

      const userMessage: ChatMessage = {
        id: `message-e2e-${String(this.messageCounter).padStart(3, "0")}`,
        role: "USER",
        content: question,
        createdAt: nowIso(),
        metadata: null,
      };
      this.messageCounter += 1;

      const assistantMessage: ChatMessage = {
        id: `message-e2e-${String(this.messageCounter).padStart(3, "0")}`,
        role: "ASSISTANT",
        content: body?.kbOnly
          ? "Here is a scoped answer based on your salon knowledge base."
          : "Here is a broader answer that includes global knowledge.",
        createdAt: nowIso(),
        metadata: null,
      };
      this.messageCounter += 1;

      const existingMessages = this.messagesBySession[sessionId] ?? [];
      this.messagesBySession[sessionId] = [...existingMessages, userMessage, assistantMessage];
      this.sessions = this.sessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              title: session.title && session.title !== "New chat" ? session.title : question,
              updatedAt: assistantMessage.createdAt,
            }
          : session,
      );

      await this.fulfillJson(route, 200, { userMessage, assistantMessage });
      return;
    }

    if (method === "GET" && apiPath === "/file-manager/files") {
      await this.fulfillJson(route, 200, []);
      return;
    }

    await this.fulfillJson(route, 501, {
      message: `No E2E mock configured for ${method} ${apiPath}`,
    });
  }

  private parseJson<T>(raw: string | null): T | null {
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private async fulfillJson(route: Route, status: number, body: unknown) {
    await route.fulfill({
      status,
      contentType: "application/json",
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-credentials": "true",
      },
      body: JSON.stringify(body),
    });
  }
}
