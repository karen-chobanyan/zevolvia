import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SalonIQ",
  description: "AI SaaS for beauty salons",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
