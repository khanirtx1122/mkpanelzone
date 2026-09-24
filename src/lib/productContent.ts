export type ProductContent = {
  image: string;
  durationLabel: string;
  highlights: string[];
  whatsIncluded: string[];
  features: {
    updates: string | null;
    setupFiles: string | null;
    tutorials: string | null;
    supportLevel: string | null;
  };
};

export const productContent: Record<string, ProductContent> = {
  "elite-panel-lifetime": {
    image: "/products/elite-panel-lifetime.jpg",
    durationLabel: "Lifetime Access",
    highlights: ["Unlimited updates forever", "Highest priority support", "Full feature access"],
    whatsIncluded: ["Main panel application", "All setup files", "Detailed video tutorials", "24/7 Priority Support"],
    features: {
      updates: "Lifetime",
      setupFiles: "Included",
      tutorials: "Included",
      supportLevel: "Priority 24/7",
    }
  },
  "mk-panel-3-months": {
    image: "/products/mk-panel-3-months.jpg",
    durationLabel: "90 Days",
    highlights: ["3 months of updates", "Standard support", "Full feature access"],
    whatsIncluded: ["Main panel application", "Setup files", "Basic tutorials", "Standard Support"],
    features: {
      updates: "90 Days",
      setupFiles: "Included",
      tutorials: "Included",
      supportLevel: "Standard",
    }
  },
  "mk-panel-monthly": {
    image: "/products/mk-panel-monthly.jpg",
    durationLabel: "30 Days",
    highlights: ["1 month of updates", "Standard support", "Full feature access"],
    whatsIncluded: ["Main panel application", "Setup files", "Basic tutorials", "Standard Support"],
    features: {
      updates: "30 Days",
      setupFiles: "Included",
      tutorials: "Included",
      supportLevel: "Standard",
    }
  },
  "mk-panel-weekly": {
    image: "/products/mk-panel-weekly.jpg",
    durationLabel: "7 Days",
    highlights: ["7 days of updates", "Trial support", "Full feature access"],
    whatsIncluded: ["Main panel application", "Setup files", "Basic tutorials", "Trial Support"],
    features: {
      updates: "7 Days",
      setupFiles: "Included",
      tutorials: "Included",
      supportLevel: "Trial",
    }
  },
  "mk-setup-pack": {
    image: "/products/mk-setup-pack.jpg",
    durationLabel: "One-time",
    highlights: ["Complete setup files", "Guided tutorials", "No subscription required"],
    whatsIncluded: ["All required tools", "Video tutorials", "Written guides"],
    features: {
      updates: "-",
      setupFiles: "Included",
      tutorials: "Included",
      supportLevel: "-",
    }
  },
   "mk-priority-support": {
     image: "/products/mk-priority-support.jpg",
     durationLabel: "One-time",
     highlights: ["1-on-1 assistance", "Installation help", "Troubleshooting"],
     whatsIncluded: ["Direct chat access", "Remote assistance if needed"],
     features: {
       updates: "-",
       setupFiles: "-",
       tutorials: "-",
       supportLevel: "Premium",
     }
   }
};

export const globalFAQ = [
  {
    question: "How do I receive my access?",
    answer: "Once you purchase a plan and upload your payment proof, our team manually verifies the transaction. You will receive your login details directly after verification is complete."
  },
  {
    question: "How long does verification take?",
    answer: "Verification usually takes between 1 to 12 hours depending on the time of day and the payment method used. We process all orders manually to ensure security."
  },
  {
    question: "Which devices are supported?",
    answer: "Currently, our panel and tools are optimized for Android devices. Some features require a rooted environment, while others can work via Shizuku. Please check the setup guides."
  },
  {
    question: "Can I use my access on more than one device?",
    answer: "No — each purchase covers a single device. Sharing or reselling an account is a breach of the licence and results in a permanent ban. If you change hardware, contact support and we will transfer the access for you."
  },
  {
    question: "How do I contact support?",
    answer: "If you have purchased a plan with support included, you can open a ticket from your customer dashboard. Alternatively, you can reach out via the Contact Support page."
  }
];

export const trustList = [
  "Access details sent after payment verification",
  "Setup guides included in your dashboard",
  "Support available through the Support page"
];
