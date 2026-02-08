export const E2E_ORG_ID = "org-e2e-001";

export const E2E_USER = {
  sub: "user-e2e-001",
  email: "owner.e2e@saloniq.test",
  orgId: E2E_ORG_ID,
  roleId: "owner",
  permissions: ["dashboard:read", "chat:read", "chat:write"],
};

export function buildDashboardSummary(orgId: string = E2E_ORG_ID) {
  return {
    orgId,
    generatedAt: "2026-01-01T00:00:00.000Z",
    widgets: {
      members: 4,
      files: 18,
      storageBytes: 10_485_760,
      chatSessions: 12,
      chatMessages: 88,
      pendingInvites: 1,
    },
    charts: {
      uploadsByMonth: [{ label: "Jan", count: 8, bytes: 1_024_000 }],
      messagesByMonth: [{ label: "Jan", count: 42 }],
      sessionsByMonth: [{ label: "Jan", count: 7 }],
    },
    lists: {
      recentMembers: [
        {
          userId: "user-e2e-002",
          email: "stylist.e2e@saloniq.test",
          role: "stylist",
          joinedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      recentFiles: [
        {
          id: "file-e2e-001",
          name: "pricing-sheet.pdf",
          size: 1024,
          mimeType: "application/pdf",
          status: "READY",
          ragStatus: "INDEXED",
          url: null,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      recentChats: [
        {
          id: "session-e2e-001",
          title: "Stylist scheduling questions",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          messageCount: 2,
          lastMessageAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    },
  };
}

export function buildChatSessions(orgId: string = E2E_ORG_ID) {
  return [
    {
      id: "session-e2e-001",
      orgId,
      title: "Stylist scheduling questions",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ];
}

export function buildChatMessages() {
  return [
    {
      id: "message-e2e-001",
      role: "USER",
      content: "How should we handle no-shows this week?",
      createdAt: "2026-01-01T00:00:00.000Z",
      metadata: null,
    },
    {
      id: "message-e2e-002",
      role: "ASSISTANT",
      content: "Offer a same-day confirmation text and waitlist backup.",
      createdAt: "2026-01-01T00:00:01.000Z",
      metadata: null,
    },
  ];
}
