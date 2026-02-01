import ChatPageClient from "@/components/chats/ChatPageClient";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "AI Chat",
  description: "Chat with your kitchen documents using AI.",
  // other metadata
};

export default function Chat() {
  return <ChatPageClient />;
}
