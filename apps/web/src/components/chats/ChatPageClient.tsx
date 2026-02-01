"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ChatSidebar from "./ChatSidebar";
import ChatBox from "./ChatBox";
import type { ChatMessage, ChatSession } from "./chat-types";

type ApiMessage = {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
};

function mapApiMessage(message: ApiMessage): ChatMessage {
  return {
    id: message.id,
    role: message.role.toLowerCase() as ChatMessage["role"],
    message: message.content,
    createdAt: message.createdAt,
    metadata: message.metadata ?? null,
  };
}

function sortSessions(items: ChatSession[]) {
  return [...items].sort((a, b) => {
    const aTime = new Date(a.updatedAt).getTime();
    const bTime = new Date(b.updatedAt).getTime();
    return bTime - aTime;
  });
}

export default function ChatPageClient() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useGlobalKnowledge, setUseGlobalKnowledge] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) || null,
    [sessions, activeSessionId],
  );

  async function loadSessions() {
    setLoadingSessions(true);
    setError(null);
    try {
      const response = await api.get("/chat/sessions");
      const data = Array.isArray(response.data) ? response.data : [];
      const nextSessions = sortSessions(
        data.map((item: any) => ({
          id: item.id,
          title: item.title,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
      );
      setSessions(nextSessions);
      if (nextSessions.length > 0) {
        setActiveSessionId(nextSessions[0].id);
        await loadMessages(nextSessions[0].id);
      } else {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to load chats.");
    } finally {
      setLoadingSessions(false);
    }
  }

  async function createSession() {
    setError(null);
    try {
      const response = await api.post("/chat/sessions", {});
      const session = response.data;
      const nextSession: ChatSession = {
        id: session.id,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      };
      setSessions((prev) => sortSessions([nextSession, ...prev]));
      setActiveSessionId(nextSession.id);
      setMessages([]);
      return nextSession.id;
    } catch (err: any) {
      setError(err?.message ?? "Failed to create chat session.");
      throw err;
    }
  }

  async function loadMessages(sessionId: string) {
    setLoadingMessages(true);
    setError(null);
    try {
      const response = await api.get(`/chat/sessions/${sessionId}/messages`);
      const data = Array.isArray(response.data) ? response.data : [];
      setMessages(data.map(mapApiMessage));
    } catch (err: any) {
      setError(err?.message ?? "Failed to load messages.");
    } finally {
      setLoadingMessages(false);
    }
  }

  async function handleSelectSession(sessionId: string) {
    if (sessionId === activeSessionId) {
      return;
    }
    setActiveSessionId(sessionId);
    await loadMessages(sessionId);
  }

  async function handleNewChat() {
    if (sending) {
      return;
    }
    await createSession();
  }

  async function handleSend() {
    const question = draft.trim();
    if (!question || sending) {
      return;
    }

    let sessionId = activeSessionId;
    if (!sessionId) {
      try {
        sessionId = await createSession();
      } catch (err: any) {
        setError(err?.message ?? "Failed to create chat session.");
        return;
      }
    }

    const tempId = `temp-${Date.now()}`;
    const tempMessage: ChatMessage = {
      id: tempId,
      role: "user",
      message: question,
      createdAt: new Date().toISOString(),
      metadata: null,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setDraft("");
    setSending(true);
    setError(null);

    try {
      const response = await api.post(`/chat/sessions/${sessionId}/ask`, {
        question,
        kbOnly: !useGlobalKnowledge,
      });
      const userMessage = mapApiMessage(response.data.userMessage);
      const assistantMessage = mapApiMessage(response.data.assistantMessage);

      setMessages((prev) => {
        const withoutTemp = prev.filter((msg) => msg.id !== tempId);
        return [...withoutTemp, userMessage, assistantMessage];
      });

      setSessions((prev) => {
        const updatedAt = new Date().toISOString();
        const next = prev.map((session) => {
          if (session.id !== sessionId) {
            return session;
          }
          const nextTitle =
            session.title && session.title !== "New chat" ? session.title : question.slice(0, 80);
          return { ...session, title: nextTitle, updatedAt };
        });
        return sortSessions(next);
      });
    } catch (err: any) {
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setError(err?.message ?? "Failed to send message.");
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          message: "Sorry, something went wrong. Please try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="AI Chat" />
      <div className="h-[calc(100vh-150px)] overflow-hidden sm:h-[calc(100vh-174px)]">
        <div className="flex flex-col h-full gap-6 xl:flex-row xl:gap-5">
          <ChatSidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewChat}
            loading={loadingSessions}
          />
          <ChatBox
            messages={messages}
            sessionTitle={activeSession?.title || "New chat"}
            loading={loadingMessages}
            error={error}
            draft={draft}
            onDraftChange={setDraft}
            onSend={handleSend}
            sending={sending}
            onNewChat={handleNewChat}
            useGlobalKnowledge={useGlobalKnowledge}
            onGlobalKnowledgeChange={setUseGlobalKnowledge}
          />
        </div>
      </div>
    </div>
  );
}
