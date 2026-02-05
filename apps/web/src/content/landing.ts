import { Bell, Calendar, Clock, MessageSquare, Plug, Sparkles } from "lucide-react";

export const heroContent = {
  eyebrow: "SMS booking that plugs into your existing system",
  headline: "The 5-minute SMS booking AI for salons on Vagaro, Fresha, or Boulevard.",
  subheadline:
    "Clients book like they are texting a friend. SalonIQ checks your real calendar, confirms instantly, and keeps chairs full even after hours.",
  ctaText: "Book a 10-minute demo",
  ctaSubtext: "Setup in 15 minutes. $99/month. No contracts.",
  secondaryCtaText: "See the text flow",
  secondaryCtaHref: "#how-it-works",
  highlights: [
    "Works with the software you already use",
    "Understands salon services like balayage, highlights, and root touch-ups",
    "Instant confirmations with staff notifications",
  ],
};

export const demoMessages = [
  { type: "user" as const, text: "Hi! Can I do balayage next Tuesday after 3?" },
  {
    type: "assistant" as const,
    text: "Absolutely! Do you have a preferred stylist, or should I match you?",
  },
  { type: "user" as const, text: "Match me with someone good." },
  {
    type: "assistant" as const,
    text: "Perfect. I can do 3:30 PM or 5:15 PM with Lena. Which works?",
  },
  { type: "user" as const, text: "3:30 works." },
  {
    type: "assistant" as const,
    text: "Booked! You are set for Tue 3:30 PM. I just sent a confirmation link.",
  },
];

export const socialProof = {
  text: "Works with the tools you already use",
  metric: "Text booking that feels like a personal concierge",
  logos: [
    { name: "Vagaro", src: "/images/logos/vagaro.svg" },
    { name: "Fresha", src: "/images/logos/fresha.svg" },
    { name: "Boulevard", src: "/images/logos/boulevard.svg" },
  ],
};

export const proofStats = [
  { value: "15 min", label: "Average setup time" },
  { value: "24/7", label: "Booking coverage" },
  { value: "< 1 min", label: "Typical response" },
  { value: "$99", label: "Flat monthly price" },
];

export const problemPoints = [
  {
    icon: "MessageSquare",
    title: "Texts stack up while you are mid-service",
    description: "Clients message while you are busy, then book elsewhere when no one replies.",
    stat: "First response wins the booking",
  },
  {
    icon: "Clock",
    title: "After-hours requests go unanswered",
    description: "Most booking requests come in evenings and weekends when no one is on the phone.",
    stat: "Capture bookings while you sleep",
  },
  {
    icon: "Calendar",
    title: "Forms feel like friction",
    description: "Multi-step booking forms drop conversions for clients who just want to text.",
    stat: "Conversation converts better",
  },
];

export const howItWorksSteps = [
  {
    icon: "Plug",
    title: "Connect your booking system",
    description: "We plug into Vagaro, Fresha, or Boulevard in about 15 minutes.",
    bullets: ["No switching platforms", "No retraining your team", "Works with your real calendar"],
  },
  {
    icon: "MessageSquare",
    title: "Clients text your salon number",
    description: "No apps or forms. Just a natural text conversation.",
    bullets: [
      "Understands salon services",
      "Asks clarifying questions",
      "Handles pricing and duration",
    ],
  },
  {
    icon: "Bell",
    title: "SalonIQ books and confirms",
    description: "Bookings are confirmed instantly and your team is notified.",
    bullets: [
      "Automatic confirmations",
      "Staff alerts for every booking",
      "Easy reschedule and cancel",
    ],
  },
];

export const features = [
  {
    icon: MessageSquare,
    title: "SMS-native booking",
    description: "Clients book in one text thread, just like they do with friends.",
  },
  {
    icon: Plug,
    title: "Plug-and-play setup",
    description: "Keep your current booking software and make it smarter in minutes.",
  },
  {
    icon: Sparkles,
    title: "Salon-fluent AI",
    description: "Understands services, timing, and salon language without confusion.",
  },
  {
    icon: Calendar,
    title: "Real-time calendar checks",
    description: "Never double-book. We only confirm what is truly available.",
  },
  {
    icon: Clock,
    title: "After-hours capture",
    description: "Book clients when your front desk is closed or busy.",
  },
  {
    icon: Bell,
    title: "Instant staff alerts",
    description: "Stylists get notified instantly so they can prepare.",
  },
];

export const comparisonRows = [
  {
    feature: "SMS-native conversation",
    saloniq: "Native",
    enterprise: "Add-on",
    voiceAi: "Voice-first",
    forms: "No",
  },
  {
    feature: "Setup time",
    saloniq: "15 minutes",
    enterprise: "Weeks",
    voiceAi: "Days",
    forms: "Hours",
  },
  {
    feature: "Works with existing software",
    saloniq: "Yes",
    enterprise: "Must switch",
    voiceAi: "Limited",
    forms: "Yes",
  },
  {
    feature: "Salon-specific understanding",
    saloniq: "Built for beauty",
    enterprise: "Generic",
    voiceAi: "Generic",
    forms: "Basic",
  },
  {
    feature: "Monthly cost",
    saloniq: "$99",
    enterprise: "$300+",
    voiceAi: "$199+",
    forms: "Included",
  },
];

export const testimonials = [
  {
    quote:
      "We stopped missing after-hours texts overnight. The first week alone paid for the subscription.",
    author: "Maya R.",
    role: "Owner",
    company: "Copper & Coast Salon",
  },
  {
    quote:
      "Clients love that they can just text. It feels like a concierge without adding front desk staff.",
    author: "Anthony L.",
    role: "Director",
    company: "Studio 28",
  },
  {
    quote:
      "Setup took one call and we kept our existing software. Bookings are smoother and faster now.",
    author: "Sofia M.",
    role: "Manager",
    company: "The Gloss Lounge",
  },
];

export const pricingTiers = [
  {
    name: "Single Location",
    price: "$99",
    period: "/month",
    description: "Everything you need to book via text without new staff.",
    features: [
      "Unlimited SMS booking",
      "Connects to Vagaro, Fresha, Boulevard",
      "Salon-fluent service understanding",
      "Automatic confirmations + staff alerts",
      "30-day money-back guarantee",
    ],
    cta: "Book a 10-minute demo",
    highlight: true,
  },
  {
    name: "Multi-Location",
    price: "$199",
    period: "/month",
    description: "For growing salon groups and multi-chair teams.",
    features: [
      "Everything in Single Location",
      "Shared reporting across locations",
      "Priority onboarding and support",
      "Custom booking rules per location",
    ],
    cta: "Talk to sales",
    highlight: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Need advanced workflows, SLAs, or custom integrations?",
    features: [
      "Dedicated success manager",
      "Custom security + compliance",
      "Multi-brand support",
      "Volume pricing",
    ],
    cta: "Contact enterprise",
    highlight: false,
  },
];

export const faqs = [
  {
    question: "Do I have to switch from Vagaro, Fresha, or Boulevard?",
    answer:
      "No. SalonIQ plugs into your existing system so you keep your calendar, stylists, and workflows.",
  },
  {
    question: "What if my clients still prefer calling?",
    answer:
      "They can. SalonIQ does not replace your personal touch. It simply captures the texts and after-hours requests you cannot answer.",
  },
  {
    question: "How accurate is the booking AI?",
    answer:
      "We check your real calendar before confirming anything and ask clarifying questions when needed. Every booking is sent to your team to review.",
  },
  {
    question: "How long does setup take?",
    answer:
      "Most salons are live in about 15 minutes. We handle the connection and you just start receiving texts.",
  },
  {
    question: "What if it does not work for my salon?",
    answer:
      "Try it risk-free. If you do not see a meaningful lift in bookings, we will refund your first month.",
  },
];

export const footerContent = {
  headline: "Ready to capture bookings while you sleep?",
  subheadline:
    "Book more appointments without adding staff. SalonIQ works with the system you already use.",
  ctaText: "Book a 10-minute demo",
  ctaSubtext: "No credit card required. Setup in 15 minutes.",
};

export const navItems = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Integrations", href: "#integrations" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];
