import Image from "next/image";
import Link from "next/link";
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
  comparisonRows,
  testimonials,
  pricingTiers,
  faqs,
} from "@/content/landing";
import { FAQAccordion, PhoneMockup } from "@/components/landing";
import { ArrowRight, Bell, Calendar, Check, Clock, MessageSquare, Plug, Star } from "lucide-react";

const iconMap = {
  MessageSquare,
  Clock,
  Calendar,
  Plug,
  Bell,
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white font-sans text-gray-900 selection:bg-brand-500 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo/logo.svg"
              alt="Evolvia Logo"
              width={172}
              height={40}
              className="h-9 w-auto"
              priority
            />
          </Link>
          <div className="hidden items-center gap-8 md:flex">
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
            <Link
              href="/signup"
              className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              Book demo
            </Link>
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
          <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-brand-50/60 to-white/95" />
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
              {heroContent.highlights.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="mt-0.5 h-4 w-4 text-brand-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
              >
                {heroContent.ctaText}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={heroContent.secondaryCtaHref}
                className="inline-flex items-center justify-center rounded-full border border-gray-300 px-6 py-4 text-sm font-semibold text-gray-700 transition-colors hover:border-brand-300 hover:text-brand-700"
              >
                {heroContent.secondaryCtaText}
              </Link>
            </div>
            <p className="mt-3 text-sm text-gray-600">{heroContent.ctaSubtext}</p>

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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
              Plug in, go live, and let Evolvia handle the conversations while you focus on clients.
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

      {/* Integrations */}
      <section id="integrations" className="scroll-mt-24 bg-brand-50 py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex items-center rounded-full bg-white px-4 py-1.5 text-sm font-medium text-brand-700">
              Integrations
            </span>
            <h2 className="mt-4 font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
              Keep your booking system. Make it smarter.
            </h2>
            <p className="mt-4 text-lg text-gray-700">
              Evolvia connects to your existing calendar so you never have to migrate data or
              retrain staff. Clients just text your salon number and bookings appear where they
              always have.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">No switching platforms</p>
                <p className="mt-1 text-sm text-gray-600">Keep your current software stack.</p>
              </div>
              <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">Your salon number stays</p>
                <p className="mt-1 text-sm text-gray-600">
                  Clients text the same number as always.
                </p>
              </div>
              <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">Real-time availability</p>
                <p className="mt-1 text-sm text-gray-600">Only confirm what is truly open.</p>
              </div>
              <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">Staff notifications</p>
                <p className="mt-1 text-sm text-gray-600">Every booking is logged and shared.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-brand-200 bg-white/80 p-6 shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">
              Built for salon ops
            </p>
            <h3 className="mt-3 text-xl font-semibold text-gray-900">
              Works with your current stack
            </h3>
            <div className="mt-6 flex flex-wrap gap-3">
              {socialProof.logos.map((logo) => (
                <div
                  key={logo.name}
                  className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700"
                >
                  {logo.name}
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-semibold text-gray-900">No replacement anxiety</p>
              <p className="mt-2 text-sm text-gray-600">
                Evolvia is an add-on, not a rip-and-replace system. Start today without changing
                anything else.
              </p>
              <Link
                href="/signup"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                Book a demo <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
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

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
        </div>
      </section>

      {/* Comparison */}
      <section id="comparison" className="scroll-mt-24 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <span className="inline-flex items-center rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
              Comparison
            </span>
            <h2 className="mt-4 font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
              Built to complement, not replace
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              A quick look at how Evolvia stacks up against enterprise platforms, voice AI, and
              booking forms.
            </p>
          </div>

          <div className="mt-10 overflow-x-auto rounded-2xl border border-gray-200">
            <table className="min-w-[720px] w-full border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4">Feature</th>
                  <th className="bg-brand-50 px-5 py-4 text-brand-700">Evolvia</th>
                  <th className="px-5 py-4">Zenoti/Booker</th>
                  <th className="px-5 py-4">Voice AI</th>
                  <th className="px-5 py-4">Online Forms</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="border-t border-gray-200">
                    <td className="px-5 py-4 font-medium text-gray-900">{row.feature}</td>
                    <td className="bg-brand-50 px-5 py-4 font-semibold text-brand-800">
                      {row.zevolvia}
                    </td>
                    <td className="px-5 py-4 text-gray-600">{row.enterprise}</td>
                    <td className="px-5 py-4 text-gray-600">{row.voiceAi}</td>
                    <td className="px-5 py-4 text-gray-600">{row.forms}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

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

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-24 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <span className="inline-flex items-center rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
              Pricing
            </span>
            <h2 className="mt-4 font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
              Simple, transparent plans
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Clear pricing that pays for itself with just a few extra bookings each month.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border bg-white p-6 shadow-sm ${
                  tier.highlight
                    ? "border-brand-500 shadow-lg ring-2 ring-brand-400"
                    : "border-gray-200"
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                    Most popular
                  </div>
                )}
                <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
                <p className="mt-1 text-sm text-gray-600">{tier.description}</p>
                <div className="mt-5 flex items-end gap-1">
                  <span className="text-3xl font-bold text-gray-900">{tier.price}</span>
                  <span className="text-sm text-gray-500">{tier.period}</span>
                </div>
                <div className="mt-6 space-y-3 text-sm text-gray-600">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 text-brand-600" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/signup"
                  className={`mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition-colors ${
                    tier.highlight
                      ? "bg-brand-600 text-white hover:bg-brand-700"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

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
              Everything you need to know about Evolvia before you launch.
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
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo/logo.svg"
              alt="Evolvia Logo"
              width={172}
              height={40}
              className="h-9 w-auto"
            />
          </Link>
          <p className="text-sm text-gray-500">
            (c) {new Date().getFullYear()} Evolvia. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <Link href="/login" className="hover:text-white">
              Sign in
            </Link>
            <Link href="/signup" className="hover:text-white">
              Book demo
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
