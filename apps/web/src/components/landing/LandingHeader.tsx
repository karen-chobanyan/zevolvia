"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "./Container";
import { cn } from "@/utils";

interface NavItem {
  label: string;
  href: string;
}

interface LandingHeaderProps {
  navItems?: NavItem[];
}

const defaultNavItems: NavItem[] = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
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
              alt="KitchenDocs Logo"
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
          <div className="hidden items-center gap-4 md:flex">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md"
            >
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Link>
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
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="mx-4 mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#667eea] to-[#764ba2] py-3 text-base font-semibold text-white"
                >
                  Start Free Trial <ArrowRight className="h-5 w-5" />
                </Link>
              </nav>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
