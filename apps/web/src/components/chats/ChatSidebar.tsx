"use client";
import ChatList from "./ChatList";
import ChatHeader from "./ChatHeader";
import { useState } from "react";
import type { ChatSession } from "./chat-types";

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  loading?: boolean;
}

export default function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  loading,
}: ChatSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 transition-all duration-300 bg-gray-900/50 z-999999"
          onClick={toggleSidebar}
        ></div>
      )}
      <div className="flex-col rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] xl:flex xl:w-1/4">
        <ChatHeader onToggle={toggleSidebar} onNewChat={onNewChat} />
        <ChatList
          isOpen={isOpen}
          onToggle={toggleSidebar}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={onSelectSession}
          loading={loading}
        />
      </div>
    </>
  );
}
