import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ReactNode } from "react";
// import "simplebar-react/dist/simplebar.min.css";
// import "swiper/swiper-bundle.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | SalonIQ",
    default: "SalonIQ - AI-Driven SaaS for Luxury Salons",
  },
  description:
    "Automate bookings, personalized client experiences, and scale revenue with SalonIQ's intuitive AI suite.",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased dark:bg-gray-900`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </ThemeProvider>
        {/* <GoogleAnalytics gaId="G-CK419QBRWM" /> */}
      </body>
    </html>
  );
}
