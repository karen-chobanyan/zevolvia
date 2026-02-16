import {
  BarChart3,
  Bell,
  Calendar,
  ClipboardList,
  MessageCircle,
  Moon,
  Scissors,
  Users,
} from "lucide-react";

export const heroContent = {
  eyebrow: "The AI booking system built for salons",
  headline: "Your clients text. Zevolvia books. You grow.",
  subheadline:
    "The complete AI booking platform for salons — handle appointments, reminders, and client management via SMS. Works on its own or with the tools you already use.",
  ctaText: "Start Your Free Trial",
  ctaSubtext: "Free for 30 days. No credit card. No contracts.",
  secondaryCtaText: "See how it works ↓",
  secondaryCtaHref: "#how-it-works",
  highlights: [
    { icon: "check", text: "Full booking system — no other software needed" },
    {
      icon: "plug",
      text: "Integrates with Vagaro, GlossGenius, Boulevard, Google Calendar & more",
    },
    { icon: "message", text: "Clients book via text — 24/7, even after hours" },
    { icon: "zap", text: "Live in 15 minutes, free for 30 days" },
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
    { name: "Your booking system" },
    { name: "Your calendar stack" },
    { name: "Your salon workflows" },
  ],
};

export const proofStats = [
  { value: "Under 60 seconds", label: "Average booking time" },
  { value: "24/7", label: "After-hours capture" },
  { value: "15 minutes", label: "Setup time" },
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
    description: "We plug into your current booking software in about 15 minutes.",
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
    title: "Zevolvia books and confirms",
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
    icon: MessageCircle,
    title: "SMS-native booking",
    description:
      "Clients book in one text thread, like texting a friend. No app, no login, no friction.",
  },
  {
    icon: Scissors,
    title: "Salon-fluent AI",
    description:
      "Understands balayage vs. highlights, knows a men's cut takes 30 minutes, asks the right follow-ups.",
  },
  {
    icon: Calendar,
    title: "Real-time calendar",
    description:
      "Built-in scheduling that prevents double-booking. See your whole team's day at a glance.",
  },
  {
    icon: Users,
    title: "Smart staff matching",
    description:
      "Assigns the right stylist based on skill, availability, and client preference — automatically.",
  },
  {
    icon: ClipboardList,
    title: "Client management",
    description:
      "Track visit history, preferences, no-shows, and rebooking patterns. Know your clients before they sit down.",
  },
  {
    icon: Moon,
    title: "After-hours capture",
    description:
      "Book clients at 11 PM, 6 AM, Sunday afternoon. Never lose a booking to 'we're closed.'",
  },
  {
    icon: Bell,
    title: "Automated reminders",
    description: "Reduce no-shows by 60% with smart SMS reminders 24h and 2h before appointments.",
  },
  {
    icon: BarChart3,
    title: "Analytics dashboard",
    description:
      "See booking volume, revenue per stylist, peak hours, and conversion rates. Data-driven decisions.",
  },
];

export const comparisonRows = [
  {
    feature: "SMS-native conversation",
    zevolvia: "Native",
    enterprise: "Add-on",
    voiceAi: "Voice-first",
    forms: "No",
  },
  {
    feature: "Setup time",
    zevolvia: "15 minutes",
    enterprise: "Weeks",
    voiceAi: "Days",
    forms: "Hours",
  },
  {
    feature: "Works with existing software",
    zevolvia: "Yes",
    enterprise: "Must switch",
    voiceAi: "Limited",
    forms: "Yes",
  },
  {
    feature: "Salon-specific understanding",
    zevolvia: "Built for beauty",
    enterprise: "Generic",
    voiceAi: "Generic",
    forms: "Basic",
  },
  {
    feature: "Monthly cost",
    zevolvia: "$19 + $9/seat",
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
    name: "Starter",
    price: "$19",
    period: "to start",
    description: "Base subscription to launch Zevolvia in your salon.",
    features: [
      "Full AI booking system",
      "SMS booking, reminders, and client management",
      "Works standalone or with your existing tools",
    ],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Additional Seats",
    price: "$9",
    period: "per seat/staff",
    description: "Scale with your team as you add more staff.",
    features: [
      "Per additional seat/staff member",
      "Same booking automation across all seats",
      "Simple usage-based scaling",
    ],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Annual Subscription",
    price: "20% off",
    period: "",
    description: "Save 20% when billed annually.",
    features: [
      "Discount applies to the full subscription",
      "Lower total cost as you grow seats",
      "Same pricing model, billed yearly",
    ],
    cta: "Choose Annual",
    highlight: false,
  },
];

export const faqs = [
  {
    question: "Do I have to switch from my current booking software?",
    answer:
      "No. Zevolvia plugs into your existing system so you keep your calendar, stylists, and workflows.",
  },
  {
    question: "What if my clients still prefer calling?",
    answer:
      "They can. Zevolvia does not replace your personal touch. It simply captures the texts and after-hours requests you cannot answer.",
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
    "Book more appointments without adding staff. Zevolvia works with the system you already use.",
  ctaText: "Start Your Free Trial",
  ctaSubtext: "No credit card required. Setup in 15 minutes.",
};

export const navItems = [
  { label: "Solutions", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];
