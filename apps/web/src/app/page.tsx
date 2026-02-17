import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import {
  heroContent,
  socialProof,
  features,
  footerContent,
  navItems,
  demoMessages,
  proofStats,
  problemPoints,
  howItWorksSteps,
  testimonials,
  faqs,
} from "@/content/landing";
import { FAQAccordion, PhoneMockup, PricingSection, ROICalculator } from "@/components/landing";
import {
  ArrowRight,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  MessageCircle,
  MessageSquare,
  Plug,
  Star,
  Zap,
} from "lucide-react";

const iconMap = {
  MessageSquare,
  Clock,
  Calendar,
  Plug,
  Bell,
};

const heroHighlightIconMap = {
  check: CheckCircle2,
  plug: Plug,
  message: MessageCircle,
  zap: Zap,
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white font-sans text-gray-900 selection:bg-brand-500 selection:text-white">
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1673385903293674');
fbq('track', 'PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src="https://www.facebook.com/tr?id=1673385903293674&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo/logo.svg"
              alt="Zevolvia Logo"
              width={172}
              height={40}
              className="h-9 w-auto"
              priority
            />
          </Link>
          <div className="ml-auto hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-gray-600 transition-colors hover:text-brand-600"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-brand-600"
            >
              Sign in
            </Link>
            <div className="group relative">
              <Link
                href="/signup"
                className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
              >
                Start Free Trial
              </Link>
              <p className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap text-[11px] text-gray-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                No credit card required
              </p>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pb-20 pt-32 lg:pb-28 lg:pt-44">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/landing/hero-bg.png"
            alt="Salon Interior"
            fill
            className="object-cover opacity-90"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/80 to-brand-50/70" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-100/80 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-brand-800">
              {heroContent.eyebrow}
            </span>
            <h1 className="mt-5 font-serif text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              {heroContent.headline}
            </h1>
            <p className="mt-6 text-lg font-medium leading-relaxed text-gray-800">
              {heroContent.subheadline}
            </p>

            <div className="mt-6 grid gap-3">
              {heroContent.highlights.map((item) => {
                const Icon = heroHighlightIconMap[item.icon as keyof typeof heroHighlightIconMap];
                return (
                  <div key={item.text} className="flex items-start gap-3 text-sm text-gray-700">
                    <Icon className="mt-0.5 h-4 w-4 text-brand-600" />
                    <span>{item.text}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex flex-col items-start">
                <Link
                  href="/signup"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-10 py-4 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 sm:w-auto"
                >
                  {heroContent.ctaText}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <p className="mt-2 text-xs font-medium text-gray-600">{heroContent.ctaSubtext}</p>
              </div>
              <Link
                href={heroContent.secondaryCtaHref}
                className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white/85 px-6 py-3.5 text-sm font-semibold text-gray-700 transition-colors hover:border-brand-300 hover:text-brand-700"
              >
                {heroContent.secondaryCtaText}
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-600">
              {socialProof.logos.map((logo) => (
                <span
                  key={logo.name}
                  className="rounded-full border border-gray-200 bg-white/70 px-4 py-2"
                >
                  {logo.name}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
            <PhoneMockup messages={demoMessages} />
            <div className="absolute -bottom-6 -left-4 hidden rounded-2xl border border-gray-200 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-md lg:block">
              <p className="text-xs font-semibold text-gray-700">Average booking time</p>
              <p className="text-lg font-bold text-gray-900">Under 60 seconds</p>
            </div>
            <div className="absolute -right-6 top-6 hidden rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 shadow-lg lg:block">
              <p className="text-xs font-semibold text-brand-700">After-hours capture</p>
              <p className="text-lg font-bold text-brand-900">24/7</p>
            </div>
            <div className="absolute -bottom-10 right-4 hidden rounded-2xl border border-gray-200 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-md lg:block">
              <p className="text-xs font-semibold text-gray-700">Setup time</p>
              <p className="text-lg font-bold text-gray-900">15 minutes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Proof */}
      <section id="proof" className="border-y border-gray-100 bg-white py-12">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-2xl font-serif font-medium text-gray-900">{socialProof.metric}</p>
            <p className="mt-2 text-sm uppercase tracking-wider text-gray-500">
              {socialProof.text}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {proofStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-5 text-center shadow-sm"
              >
                <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                <div className="mt-1 text-xs text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="relative scroll-mt-24 bg-gray-50 py-16 sm:py-20">
        <div className="absolute inset-0">
          <div className="absolute -top-24 left-1/4 h-48 w-48 rounded-full bg-brand-200/40 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-gray-200/60 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="text-center">
            <span className="inline-flex items-center rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700">
              The problem
            </span>
            <h2 className="mt-4 font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
              Missed texts mean missed bookings
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              When you are hands-on with clients, you cannot respond fast enough to win the next
              booking.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {problemPoints.map((point) => {
              const Icon = iconMap[point.icon as keyof typeof iconMap];
              return (
                <div
                  key={point.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{point.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{point.description}</p>
                  <div className="mt-4 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                    {point.stat}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="scroll-mt-24 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <span className="inline-flex items-center rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
              How it works
            </span>
            <h2 className="mt-4 font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
              From setup to booked in days, not weeks
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Plug in, go live, and let Zevolvia handle the conversations while you focus on
              clients.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {howItWorksSteps.map((step, index) => {
              const Icon = iconMap[step.icon as keyof typeof iconMap];
              return (
                <div
                  key={step.title}
                  className="relative rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                      {index + 1}
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{step.description}</p>
                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    {step.bullets.map((bullet) => (
                      <div key={bullet} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 text-brand-600" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-24 bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full bg-white px-4 py-1.5 text-sm font-medium text-gray-700">
              Features
            </span>
            <h2 className="mt-4 font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
              Text-native booking, built for beauty
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Everything your front desk does, now handled instantly via SMS.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-brand-600 px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-brand-700"
            >
              Get all features free for 30 days
            </Link>
          </div>
        </div>
      </section>

      <ROICalculator />

      {/* Testimonials */}
      <section id="testimonials" className="scroll-mt-24 bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <span className="inline-flex items-center rounded-full bg-white px-4 py-1.5 text-sm font-medium text-gray-700">
              Success stories
            </span>
            <h2 className="mt-4 font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
              Salon teams trust text-first booking
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Early partners are already seeing smoother booking flows and happier clients.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.author}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-700">"{testimonial.quote}"</p>
                <div className="mt-6">
                  <div className="text-sm font-semibold text-gray-900">{testimonial.author}</div>
                  <div className="text-xs text-gray-500">
                    {testimonial.role}, {testimonial.company}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PricingSection />

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <span className="inline-flex items-center rounded-full bg-white px-4 py-1.5 text-sm font-medium text-gray-700">
              FAQ
            </span>
            <h2 className="mt-4 font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
              Your questions, answered
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Everything you need to know about Zevolvia before you launch.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-gray-200 bg-white px-6 shadow-sm sm:px-8">
            {faqs.map((faq, index) => (
              <FAQAccordion
                key={faq.question}
                question={faq.question}
                answer={faq.answer}
                index={index}
                defaultOpen={index === 0}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-gray-900 py-20">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -top-10 left-1/3 h-72 w-72 rounded-full bg-brand-500 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-serif text-4xl font-bold text-white sm:text-5xl">
            {footerContent.headline}
          </h2>
          <p className="mt-6 text-lg text-gray-300">{footerContent.subheadline}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-gray-900 transition-colors hover:bg-brand-50"
            >
              {footerContent.ctaText}
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="#pricing" className="text-sm font-semibold text-gray-200 hover:text-white">
              See pricing -&gt;
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">{footerContent.ctaSubtext}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900 py-12">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-2 lg:grid-cols-5">
          <div>
            <Link href="/" className="flex items-center">
              <Image
                src="/images/logo/logo.svg"
                alt="Zevolvia Logo"
                width={172}
                height={40}
                className="h-9 w-auto"
              />
            </Link>
            <p className="mt-4 text-sm text-gray-500">
              (c) {new Date().getFullYear()} Zevolvia.
              <br />
              All rights reserved.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Product</h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-400">
              <li>
                <Link href="/#how-it-works" className="hover:text-white">
                  Solutions
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-white">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-white">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-white">
                  FAQ
                </Link>
              </li>
              <li>
                <span className="text-gray-500">Changelog (Coming soon)</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Integrations</h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-400">
              <li>
                <Link href="/integrations/vagaro" className="hover:text-white">
                  Vagaro
                </Link>
              </li>
              <li>
                <Link href="/integrations/glossgenius" className="hover:text-white">
                  GlossGenius
                </Link>
              </li>
              <li>
                <Link href="/integrations/boulevard" className="hover:text-white">
                  Boulevard
                </Link>
              </li>
              <li>
                <Link href="/integrations/google-calendar" className="hover:text-white">
                  Google Calendar
                </Link>
              </li>
              <li>
                <span className="text-gray-500">All integrations (Coming soon)</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Company</h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-400">
              <li>
                <span className="text-gray-500">About (Coming soon)</span>
              </li>
              <li>
                <span className="text-gray-500">Blog (Coming soon)</span>
              </li>
              <li>
                <span className="text-gray-500">Contact (Coming soon)</span>
              </li>
              <li>
                <span className="text-gray-500">Careers (Coming soon)</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Legal</h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-400">
              <li>
                <Link href="/privacy" className="hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </main>
  );
}
