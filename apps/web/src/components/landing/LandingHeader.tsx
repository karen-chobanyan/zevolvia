"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "./Container";

interface NavItem {
  label: string;
  href: string;
}

interface LandingHeaderProps {
  navItems?: NavItem[];
}

const defaultNavItems: NavItem[] = [
  { label: "Features", href: "#features" },
  { label: "Solutions", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function LandingHeader({ navItems = defaultNavItems }: LandingHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    // Smooth scroll to section
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/50 bg-white/80 backdrop-blur-md">
      <Container>
        <div className="flex h-16 items-center justify-between sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo/logo.svg"
              alt="Zevolvia Logo"
              width={160}
              height={40}
              className="h-8 w-auto sm:h-10"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.href);
                }}
                className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden items-start gap-4 md:flex">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Sign in
            </Link>
            <div className="flex flex-col items-center">
              <Link
                href="/auth/signup"
                className="inline-flex items-center rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
              >
                Start Free Trial
              </Link>
              <p className="mt-1 text-[11px] text-gray-500">No credit card required</p>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 md:hidden"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </Container>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200 bg-white md:hidden"
          >
            <Container>
              <nav className="flex flex-col gap-1 py-4">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item.href);
                    }}
                    className="rounded-lg px-4 py-3 text-base font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                  >
                    {item.label}
                  </a>
                ))}
                <hr className="my-2 border-gray-200" />
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-3 text-base font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  Sign in
                </Link>
                <div className="mx-4 mt-2">
                  <Link
                    href="/auth/signup"
                    className="flex items-center justify-center rounded-xl bg-brand-600 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-700"
                  >
                    Start Free Trial
                  </Link>
                  <p className="mt-2 text-center text-xs text-gray-500">No credit card required</p>
                </div>
              </nav>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
