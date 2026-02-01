import { apiFetch } from "./api";

export type DashboardSummary = {
  orgId: string;
  generatedAt: string;
  widgets: {
    members: number;
    files: number;
    storageBytes: number;
    chatSessions: number;
    chatMessages: number;
    pendingInvites: number;
  };
  charts: {
    uploadsByMonth: { label: string; count: number; bytes: number }[];
    messagesByMonth: { label: string; count: number }[];
    sessionsByMonth: { label: string; count: number }[];
  };
  lists: {
    recentMembers: {
      userId: string;
      email: string;
      role: string | null;
      joinedAt: string | null;
    }[];
    recentFiles: {
      id: string;
      name: string;
      size: number;
      mimeType: string;
      status: string;
      ragStatus: string;
      url: string | null;
      createdAt: string;
    }[];
    recentChats: {
      id: string;
      title: string | null;
      createdAt: string;
      updatedAt: string;
      messageCount: number;
      lastMessageAt: string | null;
    }[];
  };
};

export async function getDashboardSummary() {
  return apiFetch<DashboardSummary>("/dashboard/summary", { method: "GET" });
}
