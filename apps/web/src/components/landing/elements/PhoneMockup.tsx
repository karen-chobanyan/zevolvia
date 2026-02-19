"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils";

interface Message {
  type: "user" | "assistant";
  text: string;
  timestamp?: string;
}

interface PhoneMockupProps {
  messages: Message[];
  className?: string;
  animated?: boolean;
}

export function PhoneMockup({ messages, className, animated = true }: PhoneMockupProps) {
  return (
    <div className={cn("relative mx-auto w-[280px] sm:w-[320px]", className)}>
      {/* Phone Frame - Titanium Finish */}
      <div className="relative rounded-[60px] bg-zinc-800 p-[3px] shadow-2xl ring-1 ring-white/10">
        {/* Side Buttons */}
        {/* Action Button */}
        <div className="absolute -left-[2px] top-24 h-7 w-1 rounded-l-md bg-zinc-700 shadow-sm" />
        {/* Volume Up */}
        <div className="absolute -left-[2px] top-36 h-12 w-1 rounded-l-md bg-zinc-700 shadow-sm" />
        {/* Volume Down */}
        <div className="absolute -left-[2px] top-52 h-12 w-1 rounded-l-md bg-zinc-700 shadow-sm" />
        {/* Power Button */}
        <div className="absolute -right-[2px] top-40 h-16 w-1 rounded-r-md bg-zinc-700 shadow-sm" />

        <div className="relative h-full w-full rounded-[57px] bg-black p-[2px]">
          {/* Bezel */}
          <div className="relative h-full w-full overflow-hidden rounded-[55px] bg-gray-100 ring-[3px] ring-black">
            {/* Dynamic Island */}
            <div className="absolute left-1/2 top-[11px] z-50 h-[28px] w-[120px] -translate-x-1/2 rounded-full bg-black shadow-sm transition-all duration-300 hover:w-[135px] hover:scale-105">
              {/* FaceID/Cam hint inside island (subtle) */}
              <div className="absolute right-5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[#1a1a1a]" />
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between bg-gray-100 px-7 pt-3.5 pb-2">
              <span className="text-[14px] font-semibold tracking-wide text-gray-900 ml-4">
                9:41
              </span>
              <div className="flex items-center gap-1.5 mr-3">
                <svg className="h-4 w-4 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M15.67 4h1.33v2h-1.33zM13 4h1.33v2H13zM10.33 4h1.33v2h-1.33zM7.67 4H9v2H7.67z"
                    opacity=".3"
                  />
                  <path d="M4 6h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm2 2v10h12V8H6z" />
                </svg>
                {/* Wifi */}
                <svg className="h-4 w-4 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zm0-12C8.69 7 6 9.69 6 13s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                {/* Battery */}
                <div className="relative h-3 w-6 rounded-[4px] border border-gray-900/40 p-[1px]">
                  <div className="h-full w-[80%] rounded-[2px] bg-gray-900" />
                </div>
              </div>
            </div>

            {/* Header */}
            <div className="border-b border-gray-200 bg-gray-100 px-4 py-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 shadow-sm">
                  <span className="text-sm font-bold text-white">EV</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Zevolvia Booking</div>
                  <div className="text-xs text-green-600 font-medium">Online</div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="h-[420px] space-y-3 overflow-y-auto bg-gray-50 p-4 scrollbar-hide">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={animated ? { opacity: 0, y: 10 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.5, duration: 0.3 }}
                  className={cn("flex", message.type === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm",
                      message.type === "user"
                        ? "rounded-br-md bg-brand-700 text-white"
                        : "rounded-bl-md bg-white text-gray-900 border border-gray-100",
                    )}
                  >
                    <p className="whitespace-pre-line text-sm leading-relaxed">{message.text}</p>
                    {message.timestamp && (
                      <p
                        className={cn(
                          "mt-1 text-right text-[10px]",
                          message.type === "user" ? "text-brand-100" : "text-gray-400",
                        )}
                      >
                        {message.timestamp}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
              {animated && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: messages.length * 0.4 + 0.2, duration: 0.3 }}
                  className="flex justify-start"
                  aria-hidden="true"
                >
                  <div className="rounded-2xl rounded-bl-md border border-gray-100 bg-white px-3 py-2 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2].map((dot) => (
                        <motion.span
                          key={dot}
                          className="h-1.5 w-1.5 rounded-full bg-gray-400"
                          animate={{ opacity: [0.35, 1, 0.35] }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: dot * 0.2,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input Bar */}
            <div className="border-t border-gray-200 bg-white p-3 pb-8">
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-full bg-gray-100 px-4 py-2.5 transition-colors hover:bg-gray-200/70">
                  <span className="text-sm text-gray-400">Text to book...</span>
                </div>
                <button className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 shadow-md transition-transform hover:scale-105 active:scale-95">
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 h-1 w-36 -translate-x-1/2 rounded-full bg-gray-900/20" />
          </div>
        </div>
      </div>

      {/* Decorative Elements (Glow) */}
      <div className="absolute -right-4 -top-4 -z-10 h-32 w-32 rounded-full bg-brand-300/30 blur-2xl" />
      <div className="absolute -bottom-6 -left-6 -z-10 h-32 w-32 rounded-full bg-brand-500/30 blur-2xl" />
    </div>
  );
}
