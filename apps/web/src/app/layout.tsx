import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Metadata } from "next";
import { Outfit } from "next/font/google";
import { ReactNode } from "react";
// import "simplebar-react/dist/simplebar.min.css";
// import "swiper/swiper-bundle.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | KitchenDocs",
    default: "KitchenDocs - AI-Powered Digital Kitchen Assistant",
  },
  description:
    "KitchenDocs helps you streamline kitchen operations, train staff faster, and stay compliant with AI-powered documentation and chat.",
};

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`} suppressHydrationWarning>
        <ThemeProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </ThemeProvider>
        <GoogleAnalytics gaId="G-CK419QBRWM" />
      </body>
    </html>
  );
}
