"use client";

import Link from "next/link";
import Image from "next/image";
import { Container } from "./Container";

type FooterLink = {
  label: string;
  href?: string;
  comingSoon?: boolean;
};

const footerLinks = {
  product: [
    { label: "Solutions", href: "/#how-it-works" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Features", href: "/#features" },
    { label: "FAQ", href: "/#faq" },
    { label: "Changelog", comingSoon: true },
  ],
  company: [
    { label: "About", comingSoon: true },
    { label: "Blog", comingSoon: true },
    { label: "Contact", comingSoon: true },
    { label: "Careers", comingSoon: true },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

export function LandingFooter() {
  const renderLinks = (links: FooterLink[]) =>
    links.map((link) => (
      <li key={link.label}>
        {link.href ? (
          <Link
            href={link.href}
            className="text-sm text-gray-600 transition-colors hover:text-gray-900"
          >
            {link.label}
          </Link>
        ) : (
          <span className="text-sm text-gray-500">
            {link.label}
            {link.comingSoon ? " (Coming soon)" : ""}
          </span>
        )}
      </li>
    ));

  return (
    <footer className="border-t border-gray-200 bg-white">
      <Container>
        {/* Main Footer */}
        <div className="grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:py-16">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center">
              <Image
                src="/images/logo/logo.svg"
                alt="Zevolvia Logo"
                width={140}
                height={35}
                className="h-8 w-auto"
              />
            </Link>
            <p className="mt-4 text-sm text-gray-600">
              AI-powered SMS booking for salons. Clients text, Zevolvia books, chairs stay full.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Product</h3>
            <ul className="mt-4 space-y-3">{renderLinks(footerLinks.product)}</ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Company</h3>
            <ul className="mt-4 space-y-3">{renderLinks(footerLinks.company)}</ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Legal</h3>
            <ul className="mt-4 space-y-3">{renderLinks(footerLinks.legal)}</ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 py-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Zevolvia. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
