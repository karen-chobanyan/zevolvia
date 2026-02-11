"use client";
import { MoreDotIcon } from "@/icons";
import { Dropdown } from "@/ui/dropdown/Dropdown";
import { DropdownItem } from "@/ui/dropdown/DropdownItem";
import Image from "next/image";
import { useState } from "react";

interface ChatBoxHeaderProps {
  sessionTitle: string;
  onNewChat: () => void;
  sending?: boolean;
}

export default function ChatBoxHeader({ sessionTitle, onNewChat, sending }: ChatBoxHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="sticky flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 xl:px-6">
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white p-1 shadow-sm dark:bg-gray-900">
          <Image
            src="/images/logo/DWavatar.jpg"
            alt="Zevolvia"
            width={40}
            height={40}
            className="h-full w-full object-contain"
          />
          <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-[1.5px] border-white bg-success-500 dark:border-gray-900"></span>
        </div>
        <div>
          <h5 className="text-sm font-semibold text-gray-800 dark:text-white/90">{sessionTitle}</h5>
          <p className="text-xs text-gray-500 dark:text-gray-400">Zevolvia assistant</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden text-xs text-gray-500 dark:text-gray-400 sm:inline">
          Mode: Assistant
        </span>
        <button
          type="button"
          onClick={onNewChat}
          disabled={sending}
          className="hidden items-center rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:text-white/90 sm:inline-flex"
        >
          New chat
        </button>
        <div className="relative -mb-1.5">
          <button onClick={toggleDropdown} className="dropdown-toggle">
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown isOpen={isOpen} onClose={closeDropdown} className="w-40 p-2">
            <DropdownItem
              onItemClick={() => {
                closeDropdown();
                onNewChat();
              }}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              New chat
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Clear conversation
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Export transcript
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
    </div>
  );
}
