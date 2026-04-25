// src/data/locations.ts
export type InteractionType = "panel" | "vignette" | "view" | "contact" | "marker" | "kiosk";
export type VisualType =
  | "campfire"
  | "laptop"
  | "mac-mini"
  | "champion-slabs"
  | "bjj-gear"
  | "phone-scout"
  | "phone-seedling"
  | "phone-meal"
  | "map-pins"
  | "tablet-workshops"
  | "kiosk"
  | "plaque"
  | "monolith"
  | "snowboard-rack"
  | "carved-stone";

export type PanelContent = {
  type: "panel";
  title: string;
  description: string;
  link?: string;
  linkLabel?: string;
  imageUrl?: string;
  stack?: string[];
};

export type ContactContent = {
  type: "contact";
  title: string;
  description: string;
  email: string;
  linkedin?: string;
  github?: string;
  link?: string;
  linkLabel?: string;
};

export type NewsletterContent = {
  type: "newsletter";
  title: string;
  description: string;
};

export type SnowboardContent = {
  type: "snowboard";
  title: string;
  description: string;
};

export type VignetteContent = { type: "vignette"; text: string };
export type ViewContent    = { type: "view";    lines: string[] };

export type LocationContent = PanelContent | VignetteContent | ViewContent | ContactContent | NewsletterContent | SnowboardContent;

export type Location = {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  phase: "ascent" | "summit" | "descent";
  visualType: VisualType;
  interactionType: InteractionType;
  proximityRadius: number;
  content: LocationContent;
};

export const LOCATIONS: Location[] = [
  // ── ASCENT ────────────────────────────────────────────────────────────────
  {
    id: "face-carving",
    name: "Manu Ramchandani",
    x: -4,
    y: 5,
    z: 58,
    phase: "ascent",
    visualType: "carved-stone",
    interactionType: "contact",
    proximityRadius: 8,
    content: {
      type: "contact",
      title: "Manu Ramchandani",
      description: "14 years building. Currently freelance. Let's talk.",
      email: "manu@manuramchandani.com",
      linkedin: "linkedin.com/in/manuramchandani",
      github: "github.com/mechanicMo",
      linkLabel: "Send a message",
    },
  },
  {
    id: "base-camp",
    name: "Base Camp",
    x: 8,
    y: 2,
    z: 52,
    phase: "ascent",
    visualType: "campfire",
    interactionType: "view",
    proximityRadius: 12,
    content: { type: "view", lines: ["Base Camp.", "The climb starts here."] },
  },
  {
    id: "prism-ledge",
    name: "Prism Ledge",
    x: 12,
    y: 14,
    z: 38,
    phase: "ascent",
    visualType: "laptop",
    interactionType: "panel",
    proximityRadius: 5,
    content: {
      type: "panel",
      title: "Prism",
      description:
        "Production SaaS demo — 15 modules, real integrations, zero mocks. Auth, analytics, AI chat, a Snake game with a global leaderboard.",
      link: "/projects/prism",
      linkLabel: "View case study",
      imageUrl: "/screenshots/prism.png",
      stack: ["React", "Supabase", "Cloudflare Workers", "Stripe", "OpenAI"],
    },
  },
  {
    id: "meal-planner-ledge",
    name: "Meal Planner",
    x: -30,
    y: 18,
    z: 13,
    phase: "ascent",
    visualType: "phone-meal",
    interactionType: "panel",
    proximityRadius: 5,
    content: {
      type: "panel",
      title: "Meal Planner",
      description:
        "Point your phone at a grocery receipt. Gemini AI scans the ingredients and generates a full recipe set — shopping list included. Built with Flutter.",
      link: "/projects/meal-planner",
      linkLabel: "View case study",
      stack: ["Flutter", "Firebase", "Gemini Vision AI"],
    },
  },
  {
    id: "agent-cave",
    name: "Agent Cave",
    x: -12,
    y: 24,
    z: 38,
    phase: "ascent",
    visualType: "mac-mini",
    interactionType: "panel",
    proximityRadius: 5,
    content: {
      type: "panel",
      title: "Sleeping Employees",
      description:
        "An AI system that monitors opportunities and generates tailored proposals while I sleep. Running 24/7 on a Mac Mini.",
      link: "https://sleepingemployees.com",
      linkLabel: "Visit sleepingemployees.com",
      stack: ["Node.js", "Claude API", "Playwright", "Mac Mini"],
    },
  },
  {
    id: "leaguelads-crag",
    name: "LeagueLads Crag",
    x: -38,
    y: 32,
    z: 13,
    phase: "ascent",
    visualType: "champion-slabs",
    interactionType: "panel",
    proximityRadius: 5,
    content: {
      type: "panel",
      title: "LeagueLads",
      description:
        "League of Legends companion — live champion pick coordination and team comp analysis powered by Riot's API.",
      link: "/projects/leaguelads",
      linkLabel: "View case study",
      stack: ["React", "Riot Games API", "Cloudflare Pages"],
    },
  },
  {
    id: "bjj-ledge",
    name: "BJJ",
    x: -12,
    y: 40,
    z: 38,
    phase: "ascent",
    visualType: "bjj-gear",
    interactionType: "marker",
    proximityRadius: 5,
    content: {
      type: "vignette",
      text: "BJJ\n10th Planet Pasadena. On the mat\nbefore the product gets built.",
    },
  },
  {
    id: "scout-perch",
    name: "Scout Perch",
    x: 12,
    y: 50,
    z: 38,
    phase: "ascent",
    visualType: "phone-scout",
    interactionType: "panel",
    proximityRadius: 5,
    content: {
      type: "panel",
      title: "Scout",
      description:
        "TV and movie discovery with AI-ranked picks and natural-language mood search. Built with React Native + Llama 70B.",
      link: "/projects/scout",
      linkLabel: "View case study",
      imageUrl: "/screenshots/scout.png",
      stack: ["React Native", "Groq / Llama 70B", "Supabase", "TMDB API"],
    },
  },
  {
    id: "workshops-shelf",
    name: "Workshops",
    x: -30,
    y: 57,
    z: 13,
    phase: "ascent",
    visualType: "tablet-workshops",
    interactionType: "panel",
    proximityRadius: 5,
    content: {
      type: "panel",
      title: "Workshops",
      description:
        "E-learning platform built with Lovable + Supabase. Covers React, TypeScript, and modern web dev. Video chapters, quizzes, and progress tracking.",
      link: "/projects/workshops",
      linkLabel: "View case study",
      stack: ["Lovable", "Supabase", "React", "TypeScript"],
    },
  },
  {
    id: "seedling-outcrop",
    name: "Seedling Outcrop",
    x: -12,
    y: 62,
    z: 38,
    phase: "ascent",
    visualType: "phone-seedling",
    interactionType: "panel",
    proximityRadius: 5,
    content: {
      type: "panel",
      title: "Seedling",
      description:
        "Neurodivergent-first learning app for young kids. Stories with ASL, seven teaching games, and an AI parent companion.",
      link: "/projects/seedling",
      linkLabel: "View case study",
      imageUrl: "/screenshots/seedling.png",
      stack: ["Flutter", "Firebase", "Gemini AI", "ElevenLabs"],
    },
  },
  {
    id: "community-approach",
    name: "Community Approach",
    x: -38,
    y: 74,
    z: 13,
    phase: "ascent",
    visualType: "map-pins",
    interactionType: "panel",
    proximityRadius: 5,
    content: {
      type: "panel",
      title: "Community",
      description:
        "Map-first volunteering app. Post a need on the map; anyone nearby can sign up. Volunteers earn a live A-F community score.",
      link: "/projects/community",
      linkLabel: "View case study",
      imageUrl: "/screenshots/community.png",
      stack: ["React Native", "Supabase", "PostGIS", "Expo"],
    },
  },

  // ── TRAIL MARKERS — personal milestone plaques, Y gaps between project stops ─
  {
    id: "marker-2012", name: "2012",
    x: 8, y: 9, z: 39,
    phase: "ascent", visualType: "plaque", interactionType: "marker", proximityRadius: 5,
    content: { type: "vignette", text: "2012\nStarted developing software." },
  },
  {
    id: "marker-2015", name: "2015",
    x: -8, y: 19, z: 39,
    phase: "ascent", visualType: "plaque", interactionType: "marker", proximityRadius: 5,
    content: { type: "vignette", text: "2015\nFirst professional dev job." },
  },
  {
    id: "marker-2018", name: "2018",
    x: 8, y: 27, z: 39,
    phase: "ascent", visualType: "plaque", interactionType: "marker", proximityRadius: 5,
    content: { type: "vignette", text: "2018\nFirst shipped product." },
  },
  {
    id: "marker-2020", name: "2020",
    x: -8, y: 36, z: 39,
    phase: "ascent", visualType: "plaque", interactionType: "marker", proximityRadius: 5,
    content: { type: "vignette", text: "2020\nGot married." },
  },
  {
    id: "marker-2024", name: "2024",
    x: 8, y: 44, z: 39,
    phase: "ascent", visualType: "plaque", interactionType: "marker", proximityRadius: 5,
    content: { type: "vignette", text: "2024\nStarted BJJ. 10th Planet Pasadena." },
  },
  {
    id: "marker-2025", name: "2025",
    x: -8, y: 55, z: 39,
    phase: "ascent", visualType: "plaque", interactionType: "marker", proximityRadius: 5,
    content: { type: "vignette", text: "2025\nWent freelance. Stay-at-home dad." },
  },
  {
    id: "marker-2026", name: "2026",
    x: 8, y: 67, z: 39,
    phase: "ascent", visualType: "plaque", interactionType: "marker", proximityRadius: 5,
    content: { type: "vignette", text: "2026\nSherani born." },
  },

  // ── DESCENT ───────────────────────────────────────────────────────────────
  {
    id: "contact-landing",
    name: "Newsletter Kiosk",
    x: 0,
    y: 2,
    z: -83,
    phase: "descent",
    visualType: "kiosk",
    interactionType: "kiosk",
    proximityRadius: 14,
    content: {
      type: "newsletter",
      title: "Sleeping Employees",
      description: "One builder. Shipping in public. Every week.",
    },
  },

  // ── SUMMIT ────────────────────────────────────────────────────────────────
  {
    id: "monolith",
    name: "The Monolith",
    x: 4, y: 82, z: -2,
    phase: "summit",
    visualType: "monolith",
    interactionType: "contact",
    proximityRadius: 6,
    content: {
      type: "contact",
      title: "Manu Ramchandani",
      description: "14 years building. Currently freelance. Let's talk.",
      email: "manu@manuramchandani.com",
      linkedin: "linkedin.com/in/manuramchandani",
      github: "github.com/mechanicMo",
      linkLabel: "Send a message",
    },
  },
  {
    id: "snowboard-cache",
    name: "Snowboard Cache",
    x: 0, y: 82, z: 4,
    phase: "summit",
    visualType: "snowboard-rack",
    interactionType: "contact",
    proximityRadius: 4,
    content: {
      type: "snowboard",
      title: "The Descent",
      description: "The other side of the mountain. Carve down to the newsletter kiosk.",
    },
  },
];
