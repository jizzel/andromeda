export const njoyHotelProposal = {
  id: "njoy-hotel-2024",
  client: {
    name: "N'Joy Hotel & Temptations Restaurant",
    location: "Tema-Spintex Corridor, Ghana",
  },
  title: "Digital Visibility & Growth Foundation",
  subtitle: "Professional Digital Presence for Hospitality Excellence",
  validityDays: 10,

  overview: {
    situation:
      "N'Joy Hotel and Temptations Restaurant currently operate with minimal online visibility, relying primarily on walk-ins and phone reservations. In the Tema-Spintex corridor, most hospitality businesses with similar offerings either rely solely on social media or operate with outdated websites that do not convert interest into action.",
    solution:
      "This project is designed to establish a professional, credible, and locally optimized digital presence that improves visibility, supports reservations and inquiries, and positions both brands for future growth without disrupting current manual operations.",
    primaryObjective:
      "The primary objective for Phase 1 is visibility, trust, and accessibility—not operational complexity.",
  },

  goals: [
    {
      id: "goal-1",
      title: "Professional Online Presence",
      description:
        "Establish a professional online presence for N'Joy Hotel and Temptations Restaurant",
      icon: "Globe",
    },
    {
      id: "goal-2",
      title: "Local Discoverability",
      description:
        'Improve discoverability for local searches such as "hotel near me" and "restaurant in Spintex"',
      icon: "Search",
    },
    {
      id: "goal-3",
      title: "Clear Information",
      description:
        "Provide clear information, amenities, menus, and contact pathways",
      icon: "Info",
    },
    {
      id: "goal-4",
      title: "Reservation Support",
      description:
        "Support phone-based reservations with optional part payment links",
      icon: "Phone",
    },
    {
      id: "goal-5",
      title: "Scalable Foundation",
      description:
        "Lay a scalable foundation for future digital expansion without forcing it prematurely",
      icon: "Layers",
    },
  ],

  phases: [
    {
      id: "phase-1a",
      label: "Phase 1A",
      title: "N'Joy Hotel Website",
      description:
        "A professionally designed, mobile-first website focused on visibility, trust, and local conversion.",
      price: "GHS 18,000",
      deliverables: [
        "5-12 page website with hospitality-grade UX",
        "Pages: Home, Rooms, Amenities, Events & Programs, Gallery, About, Contact",
        "Mobile-first responsive design",
        "Local SEO optimization for Tema-Spintex searches",
        "Click-to-call and WhatsApp Business integration",
        "Google Maps location embedding",
        "Image optimization for performance",
        "Basic contact and inquiry forms",
        "Admin training for basic content updates",
      ],
      purpose: [
        "Allow customers to find the hotel online",
        "Clearly present rooms and amenities",
        "Build trust and legitimacy",
        "Make it easy to call, message, or visit",
      ],
      note: "Online booking systems, Property Management Systems (PMS) and Online Travel Agency (OTA) integrations are intentionally excluded at this phase to align with current operations.",
      image: "https://lh3.googleusercontent.com/gps-cs-s/AG0ilSxrUm2kWIg9Q4GEQaSBO4WTarNNualbwbcytUGGjZYVCzZgN7vwOiakSj3G-cXs05oOLEcWMzMPOk9MWmI6n2jP42bl63DLYfBMGtaEMecuBtSwWaE2y0fsBX7fqEL4CSefJFjl=s1360-w1360-h1020-rw",
    },
    {
      id: "phase-1b",
      label: "Phase 1B",
      title: "Temptations Restaurant Digital Presence",
      description:
        "Modern restaurant website designed to showcase the menu, brand, and future food court vision.",
      options: [
        {
          id: "option-a",
          name: "Option A: Digital Menu Website",
          price: "GHS 10,000",
          recommended: true,
          deliverables: [
            "Mobile-optimized digital menu website",
            "Menu categorization and filtering",
            "Food image presentation and layout",
            "Social sharing functionality",
            "Structure designed to support future multi-vendor food court expansion",
            "Foundation for future delivery or ordering systems",
          ],
          purpose: [
            "Allow customers to view the menu before visiting",
            "Improve professionalism and customer confidence",
            "Easy sharing via WhatsApp and social media",
          ],
          note: "This is not a PDF upload. It is a scalable restaurant website.",
        },
        {
          id: "option-b",
          name: "Option B: Digital Order Request System",
          price: "GHS 9,000",
          recommended: false,
          addon: true,
          deliverables: [
            "Customers select items into a tray or cart",
            "Order submission with user consent",
            "Automatic order logging to Google Sheets",
            "Order summary sent to WhatsApp for staff handling",
            "Staff manually confirm orders and send payment links via Hubtel",
          ],
          purpose: [
            "Reduce order errors",
            "Improve order clarity",
            "Maintain manual control over payments and fulfillment",
          ],
          note: "This improves service efficiency without introducing PMS complexity.",
        },
      ],
      image: "https://lh3.googleusercontent.com/gps-cs-s/AG0ilSx3nSenTPWVYGOGQwU4Q4lgQUcnJNE-k6enDPu2d1x2R9SjLAnNWzv9OPld6TS9P_Em1wjJ6lb7BjDJkUnrWoMkEVd1KFFWLMW1Sti_grQ8brYb7-Mby64zaPAu3FhIqaetGMYGlfYhIaT4=s1360-w1360-h1020-rw",
    },
    {
      id: "phase-1c",
      label: "Phase 1C",
      title: "Social Media & Google Presence",
      description:
        "This is non-negotiable if visibility is the goal. Directly supports local search visibility and complements the websites.",
      price: "GHS 4,500",
      deliverables: [
        "Instagram and Facebook setup for both brands",
        "Google Business Profile setup and optimization",
        "Location verification and map visibility",
        "Profile branding, bios, highlights for both brands",
        "Photo uploads using client-provided assets",
        "Content strategy development",
        "8-12 starter posts across hotel and restaurant",
        "Initial hashtag research",
        "First month active management and engagement",
        "Review collection strategy setup",
      ],
      purpose: [
        "Establish social proof and brand presence",
        "Improve Google Maps visibility",
        "Enable customer reviews and engagement",
        "Support local search rankings",
      ],
      image: "https://images.unsplash.com/photo-1683721003111-070bcc053d8b?q=80&w=2800&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
  ],

  packages: [
    {
      id: "package-1",
      name: "Digital Menu Only",
      recommended: true,
      totalPrice: "GHS 32,500",
      includes: ["Phase 1A: N'Joy Hotel Website", "Phase 1B Option A: Digital Menu Website", "Phase 1C: Social Media & Google Presence"],
      comment:
        "This package provides immediate visibility across all digital channels while keeping operations simple and manageable.",
    },
    {
      id: "package-2",
      name: "Full Digital Order System",
      recommended: false,
      totalPrice: "GHS 41,500",
      includes: [
        "Phase 1A: N'Joy Hotel Website",
        "Phase 1B Option A: Digital Menu Website",
        "Phase 1B Option B: Digital Order Request System",
        "Phase 1C: Social Media & Google Presence",
      ],
      comment:
        "Complete digital transformation including order management capabilities.",
    },
  ],

  paymentPlans: [
    {
      id: "plan-standard",
      name: "Standard Project Payment",
      badge: "Best Value",
      totalInvestment: "GHS 32,500",
      premium: null,
      structure: [
        { milestone: "Upon contract signing", percentage: "40%", amount: "GHS 13,000" },
        { milestone: "Upon design approval", percentage: "40%", amount: "GHS 13,000" },
        { milestone: "Upon final launch", percentage: "20%", amount: "GHS 6,500" },
      ],
      includes: [
        "All Phase 1 deliverables",
        "Full social media setup and first month of active management",
        "Google Business Profile setup and optimization",
        "3 months priority email support",
        "Free domain name and SSL certificate (first year)",
      ],
      bestFor: "Clients seeking fastest delivery and lowest total cost.",
    },
    {
      id: "plan-6month",
      name: "6-Month Structured Plan",
      badge: "Flexibility",
      totalInvestment: "GHS 36,000",
      premium: "10.8%",
      structure: [
        { milestone: "Upfront (Month 0)", percentage: null, amount: "GHS 15,000" },
        { milestone: "Months 1-5", percentage: null, amount: "GHS 4,200/month" },
      ],
      includes: [
        "Everything in Standard Plan",
        "Extended Website Maintenance (6 months)",
        "Security monitoring and priority bug fixes",
        "Minor content updates (up to 2 hours/month)",
        "Social Media Support (6 months) - scheduling, caption review, insights",
      ],
      bestFor: "Clients who want manageable payments with continued technical stability.",
    },
    {
      id: "plan-12month",
      name: "12-Month Structured Plan",
      badge: "Maximum Flexibility",
      totalInvestment: "GHS 39,500",
      premium: "21.6%",
      structure: [
        { milestone: "Upfront (Month 0)", percentage: null, amount: "GHS 12,000" },
        { milestone: "Months 1-11", percentage: null, amount: "GHS 2,500/month" },
      ],
      includes: [
        "Everything in 6-Month Plan",
        "Extended Website Maintenance (12 months)",
        "CMS and plugin updates",
        "Extended Social Media Support (12 months)",
        "Performance tracking and quarterly insights",
        "Priority phone and WhatsApp support",
      ],
      bestFor: "Long-term partnership with predictable monthly investment.",
    },
  ],

  timeline: [
    {
      phase: "Design & Structure",
      duration: "2-3 weeks",
      description: "Website architecture, visual design, and layout planning",
    },
    {
      phase: "Content Gathering",
      duration: "1-2 weeks",
      description: "Collection and organization of images, text, and assets",
    },
    {
      phase: "Review & Revisions",
      duration: "2 weeks",
      description: "Client feedback, adjustments, and refinements",
    },
    {
      phase: "Launch",
      duration: "1 week",
      description: "Final testing, deployment, and go-live",
    },
  ],

  clientResponsibilities: [
    {
      title: "Content Provision",
      description:
        "Provide content (logo, images, menu details, room information, pricing, etc.) within 5 business days of contract signing",
    },
    {
      title: "Single Point of Contact",
      description: "Assign a single point of contact for approvals and communication",
    },
    {
      title: "Timely Feedback",
      description: "Provide timely feedback to maintain timeline. Delays in content provision may affect timelines.",
    },
    {
      title: "Photography",
      description:
        "Provide at least 15 high-quality images covering rooms, amenities, food, and premises. Professional photography can be quoted separately if required.",
    },
  ],

  revisions: {
    major: 1,
    minor: 2,
    note: "Additional revisions billed separately",
  },

  hosting: {
    annual: "GHS 800 - 1,500/year",
    monthly: "GHS 100 - 150/month",
    includes: ["Domain name registration (.com)", "Secure hosting setup", "SSL certificate installation", "Basic performance and security configuration"],
    note: "Hosting and domain costs are client responsibilities",
  },

  exclusions: [
    "Online PMS systems",
    "OTA integrations (Booking.com, Airbnb)",
    "Paid advertising budgets",
    "Professional photography",
    "Copywriting beyond basic content formatting",
  ],

  inspirations: {
    hotel: [
      {
        name: "Cappa Hotel Theme",
        url: "https://duruthemes.com/demo/html/cappa/demo1-light/index.html",
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
      },
      {
        name: "Grand Hotel Theme",
        url: "https://www.logicaldemo.com/grand-hotel/",
        image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80",
      },
    ],
    restaurant: [
      {
        name: "Beef Restaurant Theme",
        url: "https://preview.themeforest.net/item/beef-restaurant-react-nextjs-template/full_screen_preview/58512774",
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
      },
      {
        name: "Restan Food Theme",
        url: "https://preview.themeforest.net/item/restan-food-restaurant-next-js-template/full_screen_preview/59286405",
        image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
      },
    ],
  },

  phase2Preview: [
    "Online booking with deposit payments",
    "Loyalty or Gold Card digital system",
    "PMS and OTA integrations (Booking.com, Airbnb)",
    "Food delivery integrations",
  ],
};
