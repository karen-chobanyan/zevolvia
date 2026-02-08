"use client";

import TrialBanner from "@/components/billing/TrialBanner";
import Loading from "@/components/loading/Loading";
import { useSidebar } from "@/context/SidebarContext";
import { getMe } from "@/lib/auth";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const [authResolved, setAuthResolved] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      try {
        await getMe();
        if (isMounted) {
          setAuthResolved(true);
        }
      } catch (error) {
        const status = (error as { status?: number })?.status;
        if (status === 401) {
          const next = encodeURIComponent(window.location.pathname + window.location.search);
          router.replace(`/login?next=${next}`);
          return;
        }
        if (isMounted) {
          setAuthResolved(true);
        }
      }
    };

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Route-specific styles for the main content container
  const getRouteSpecificStyles = () => {
    switch (pathname) {
      case "/text-generator":
        return "";
      case "/code-generator":
        return "";
      case "/image-generator":
        return "";
      case "/video-generator":
        return "";
      default:
        return "p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6";
    }
  };

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "xl:ml-[290px]"
      : "xl:ml-[90px]";

  if (!authResolved) {
    return (
      <div className="min-h-screen bg-white">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}>
        {/* Trial Banner */}
        <TrialBanner />
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className={getRouteSpecificStyles()}>{children}</div>
      </div>
    </div>
  );
}
