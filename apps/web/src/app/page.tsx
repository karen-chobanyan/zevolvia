import Image from "next/image";
import Link from "next/link";
import { heroContent, socialProof, features, footerContent, navItems } from "@/content/landing";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white font-sans text-gray-900 selection:bg-brand-500 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-serif font-bold tracking-tight text-gray-900">
            Salon<span className="text-brand-500">IQ</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-gray-600 hover:text-brand-500 transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-brand-500 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/landing/hero-bg.png"
            alt="Salon Interior"
            fill
            className="object-cover opacity-90"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/40 to-white/90" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-2xl">
            <h1 className="font-serif text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl mb-6 leading-tight">
              {heroContent.headline}
            </h1>
            <p className="text-lg text-gray-800 mb-8 max-w-lg leading-relaxed font-medium">
              {heroContent.subheadline}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="flex flex-col items-center sm:items-start gap-2">
                <Link
                  href="/signup"
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-brand-500 px-8 py-4 font-medium text-white shadow-lg transition-all duration-300 hover:bg-brand-600 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 backdrop-blur-sm"
                >
                  <span className="relative z-10">{heroContent.ctaText}</span>
                  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-400 to-brand-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </Link>
                <span className="text-xs text-gray-600 ml-2">{heroContent.ctaSubtext}</span>
              </div>
            </div>
          </div>

          {/* AI Dashboard Widget */}
          <div className="relative hidden lg:block">
            <div className="relative mx-auto rounded-2xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-xl ring-1 ring-gray-900/5 rotate-[-5deg] hover:rotate-0 transition-all duration-700 ease-out hover:scale-105">
              <Image
                src="/images/landing/dashboard.png"
                alt="AI Dashboard"
                width={600}
                height={400}
                className="rounded-xl shadow-sm"
              />
            </div>
            {/* Floating Elements/Decorations */}
            <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-brand-200/50 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-gray-200/50 blur-3xl" />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section id="proof" className="bg-white py-12 border-y border-gray-100">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-2xl font-serif font-medium text-gray-900 mb-2">
                {socialProof.metric}
              </p>
              <p className="text-sm text-gray-500 uppercase tracking-wider">{socialProof.text}</p>
            </div>
            <div className="flex flex-wrap gap-8 items-center lg:justify-end grayscale opacity-70 hover:opacity-100 transition-opacity duration-500">
              {socialProof.logos.map((logo) => (
                <div
                  key={logo.name}
                  className="flex items-center gap-2 font-serif text-xl font-bold text-gray-400"
                >
                  {/* Build placeholder text if image missing since generated logos are hard */}
                  {logo.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
              AI Magic, Tailored for Beauty
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Technology that disappears into the background, leaving you with more money and less
              stress.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-gray-100"
              >
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-500 group-hover:text-white transition-colors duration-300">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 font-serif">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative py-24 bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500 rounded-full blur-3xl mix-blend-overlay"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl mix-blend-overlay"></div>
        </div>
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-serif text-4xl font-bold text-white mb-6 sm:text-5xl">
            {footerContent.headline}
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            {footerContent.subheadline}
          </p>
          <div className="flex flex-col items-center gap-4">
            <Link
              href="/demo"
              className="rounded-full bg-white px-8 py-4 text-base font-bold text-gray-900 hover:bg-brand-50 transition-colors shadow-lg hover:shadow-xl hover:scale-105 transform duration-200"
            >
              {footerContent.ctaText}
            </Link>
            <p className="text-sm text-gray-400">{footerContent.ctaSubtext}</p>
          </div>
        </div>
      </section>

      {/* Footer Links */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-white font-serif font-bold text-xl">
            Salon<span className="text-brand-500">IQ</span>
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} SalonIQ. All rights reserved.
          </p>
          <div className="flex gap-6">{/* Social icons placeholders */}</div>
        </div>
      </footer>
    </main>
  );
}
