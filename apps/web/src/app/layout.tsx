import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { MantineProvider, createTheme } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ReactNode } from "react";
import "./globals.css";

const mantineTheme = createTheme({
  primaryColor: "blue",
  fontFamily: "inherit",
});

export const metadata: Metadata = {
  title: {
    template: "%s | SalonIQ",
    default: "SalonIQ - SMS Booking AI for Salons",
  },
  description:
    "The SMS booking assistant that plugs into Vagaro, Fresha, or Boulevard so clients can book like they are texting a friend.",
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
        <MantineProvider theme={mantineTheme}>
          <ThemeProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </ThemeProvider>
        </MantineProvider>
        {/* <GoogleAnalytics gaId="G-CK419QBRWM" /> */}
      </body>
    </html>
  );
}
