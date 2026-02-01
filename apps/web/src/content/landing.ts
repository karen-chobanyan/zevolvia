import {
  MessageSquare,
  Users,
  FileQuestion,
  Zap,
  Smartphone,
  Target,
  Globe,
  BarChart3,
  Sparkles,
  Upload,
  MessageCircle,
  CheckCircle,
} from "lucide-react";

// Hero Section Content
export const heroContent = {
  headline: "Stop Answering The Same Questions 50 Times a Day",
  subheadline:
    "Your operations manual, available via text. Staff get instant, accurate answers. Managers get their time back.",
  ctaText: "Start Free 14-Day Trial",
  ctaSubtext: "No credit card required",
  socialProofText: "Join 150+ restaurants saving 10+ hours/week",
};

// Phone Demo Messages
export const demoMessages = [
  {
    type: "user" as const,
    text: "What's the procedure for a grease fire?",
    timestamp: "2:34 PM",
  },
  {
    type: "assistant" as const,
    text: "For a grease fire:\n\n1. Turn off the heat source immediately\n2. Cover with a metal lid or baking sheet\n3. Use a Class K fire extinguisher if needed\n4. NEVER use water on a grease fire\n5. Call 911 if it spreads\n\n📖 Source: Safety Manual, Page 23",
    timestamp: "2:34 PM",
  },
];

// Pain Points
export const painPoints = [
  {
    icon: "MessageSquare",
    title: "Endless Interruptions",
    description:
      "Managers spend 2+ hours daily answering the same questions from different staff members. That's 10+ hours a week lost to repetitive Q&A.",
    stat: "2+ hrs/day wasted",
  },
  {
    icon: "Users",
    title: "Training Inconsistency",
    description:
      "New hires get different answers from different people. One manager says one thing, another says something else. Confusion leads to mistakes.",
    stat: "40% of errors from miscommunication",
  },
  {
    icon: "FileQuestion",
    title: "Lost Knowledge",
    description:
      "Your operations manual is sitting in a binder nobody opens. When experienced staff leave, their knowledge walks out the door.",
    stat: "67% never check the manual",
  },
];

// Solution Steps (How It Works)
export const solutionSteps = [
  {
    stepNumber: 1,
    icon: "Upload",
    title: "Upload Your Manual",
    description:
      "PDF, Word, or text — we handle the rest. Your operations manual becomes an AI-powered knowledge base in minutes.",
    bullets: [
      "Drag and drop any document format",
      "AI automatically indexes all content",
      "Ready to answer questions in under 5 minutes",
    ],
  },
  {
    stepNumber: 2,
    icon: "MessageCircle",
    title: "Staff Texts Questions",
    description:
      "Any phone, no app needed. Staff simply text their questions to your dedicated number.",
    bullets: [
      "Works on any phone with SMS",
      "No app downloads or logins",
      "Supports Spanish and English",
    ],
  },
  {
    stepNumber: 3,
    icon: "CheckCircle",
    title: "Get Instant Answers",
    description:
      "AI responds in seconds with accurate, consistent answers pulled directly from your manual.",
    bullets: [
      "Responses in under 10 seconds",
      "Includes source citations",
      "Consistent answers every time",
    ],
  },
];

// Features (Benefit-Focused)
export const features = [
  {
    icon: "Zap",
    title: "Answers in Seconds",
    benefit: "No more waiting for a manager to be free",
    description:
      "Staff get instant responses 24/7. Questions that used to take 5 minutes of manager time now take 5 seconds.",
  },
  {
    icon: "Smartphone",
    title: "No App Required",
    benefit: "Works with any phone via SMS",
    description:
      "Your team already knows how to text. No training, no app downloads, no passwords to remember.",
  },
  {
    icon: "Target",
    title: "Always Accurate",
    benefit: "Trained on YOUR manuals, not generic info",
    description:
      "Unlike ChatGPT, our AI only answers from your approved documentation. No hallucinations, no made-up procedures.",
  },
  {
    icon: "Globe",
    title: "Multi-Language Support",
    benefit: "Staff ask in Spanish, get answers in Spanish",
    description:
      "Your Spanish-speaking team members can ask questions in their native language and get responses they understand.",
  },
  {
    icon: "BarChart3",
    title: "Usage Analytics",
    benefit: "See what questions are asked most often",
    description:
      "Identify knowledge gaps in your team. If everyone's asking about the same procedure, maybe it needs clarification.",
  },
  {
    icon: "Sparkles",
    title: "Your Brand Voice",
    benefit: "Responses match your company tone",
    description:
      "Configure how the AI responds. Professional, friendly, or somewhere in between — it sounds like your company.",
  },
];

// Testimonials
export const testimonials = [
  {
    quote:
      "We cut new hire training time in half. Instead of shadowing managers for a week, they just text their questions and get answers immediately.",
    author: "Maria Rodriguez",
    role: "General Manager",
    company: "Taco Bell Franchisee (12 locations)",
    image: "/images/testimonials/maria.jpg",
  },
  {
    quote:
      "Finally, consistent answers across all locations. Whether you're at our downtown store or the airport, you get the same correct procedure.",
    author: "James Chen",
    role: "Operations Director",
    company: "Panda Express Regional",
    image: "/images/testimonials/james.jpg",
  },
  {
    quote:
      "ROI in the first week. I did the math — I was spending $800/month in manager time answering questions. This costs a fraction of that.",
    author: "Sarah Thompson",
    role: "Multi-Unit Owner",
    company: "Subway Franchisee (8 locations)",
    image: "/images/testimonials/sarah.jpg",
  },
];

// Stats
export const stats = [
  { value: "150+", label: "Restaurants" },
  { value: "10+", label: "Hours Saved/Week" },
  { value: "95%", label: "Answer Accuracy" },
  { value: "<30s", label: "Average Setup" },
];

// Pricing Tiers
export const pricingTiers = [
  {
    name: "Starter",
    price: 79,
    yearlyPrice: 799,
    priceSuffix: "per location/month",
    locationRange: "5-10 locations",
    description: "Perfect for small franchise groups getting started",
    features: [
      "Up to 10 locations",
      "Unlimited questions",
      "Multi-language support",
      "Basic analytics dashboard",
      "Email support",
      "14-day free trial",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    price: 69,
    yearlyPrice: 699,
    priceSuffix: "per location/month",
    locationRange: "11-25 locations",
    description: "Best value for growing restaurant groups",
    features: [
      "Up to 25 locations",
      "Unlimited questions",
      "Multi-language support",
      "Advanced analytics",
      "Priority support",
      "Custom AI personality",
      "14-day free trial",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: 59,
    yearlyPrice: 599,
    priceSuffix: "per location/month",
    locationRange: "26-50 locations",
    description: "Maximum savings for large operations",
    features: [
      "Up to 50 locations",
      "Unlimited questions",
      "Multi-language support",
      "Full analytics suite",
      "Dedicated account manager",
      "Custom integrations",
      "API access",
      "14-day free trial",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
];

// FAQs
export const faqs = [
  {
    question: "How does this actually work?",
    answer:
      "You upload your operations manual (PDF, Word, or text). Our AI reads and indexes it. Then your staff can text questions to a dedicated phone number, and the AI responds with accurate answers pulled directly from your documentation — usually in under 10 seconds.",
  },
  {
    question: "What file formats do you support?",
    answer:
      "We support PDF, Word documents (.doc, .docx), plain text files, and Google Docs. If you have your manual in another format, contact us and we'll help you convert it.",
  },
  {
    question: "How long does setup take?",
    answer:
      "Most restaurants are up and running in under 30 minutes. Upload your manual, we index it automatically, and you get a dedicated phone number. That's it — your team can start texting questions immediately.",
  },
  {
    question: "Can staff ask questions in Spanish?",
    answer:
      "Yes! Our AI supports both English and Spanish. Staff can ask questions in Spanish and receive answers in Spanish. We're adding more languages based on customer demand.",
  },
  {
    question: "Why not just use ChatGPT?",
    answer:
      "ChatGPT doesn't know your specific procedures. It might give plausible-sounding but incorrect answers about food safety, equipment operation, or company policies. Our AI ONLY answers from your approved documentation — no hallucinations, no made-up procedures. Plus, ChatGPT requires internet and an account. Our SMS system works on any phone.",
  },
  {
    question: "Is our data secure?",
    answer:
      "Absolutely. Your documents are encrypted at rest and in transit. We're SOC 2 compliant and never use your data to train our models. Your operations manual stays private to your organization.",
  },
  {
    question: "What if the AI doesn't know the answer?",
    answer:
      "If a question isn't covered in your documentation, the AI will say so honestly and suggest contacting a manager. It never makes up answers. You'll also see these unanswered questions in your analytics — great for identifying gaps in your manual.",
  },
  {
    question: "Can we customize the AI's responses?",
    answer:
      "Yes! You can configure the AI's personality and tone. Want it to be formal and professional? Friendly and casual? You can also add custom sign-offs, like 'Reply MANAGER for human help' at the end of every response.",
  },
  {
    question: "Do you integrate with our POS or other systems?",
    answer:
      "Our Enterprise plan includes API access and custom integrations. We can connect with your POS, scheduling software, or internal tools. Contact us to discuss your specific needs.",
  },
  {
    question: "What's your cancellation policy?",
    answer:
      "Cancel anytime with no penalties. We offer a 14-day free trial with no credit card required. After that, you can cancel your subscription at any time and you won't be charged for the next billing cycle. We also offer a 30-day money-back guarantee if you're not satisfied.",
  },
];

// Final CTA Content
export const finalCTAContent = {
  headline: "Ready to Give Your Team Superpowers?",
  subheadline: "Join 150+ restaurants that stopped answering the same questions over and over.",
  ctaText: "Start Your Free 14-Day Trial",
  riskReversal: "No credit card required. Cancel anytime. Full data export.",
};

// Navigation Items
export const navItems = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];
