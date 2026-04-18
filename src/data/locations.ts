// src/data/locations.ts
export type InteractionType = "panel" | "gate" | "vignette" | "view" | "contact";
export type VisualType =
  | "campfire"
  | "laptop"
  | "mac-mini"
  | "champion-slabs"
  | "bjj-gear"
  | "phone-scout"
  | "phone-seedling"
  | "map-pins"
  | "slalom-gate"
  | "snow-text"
  | "lit-ground";

export type PanelContent = {
  type: "panel" | "contact";
  title: string;
  description: string;
  link?: string;
  linkLabel?: string;
  email?: string;
};

export type GateContent    = { type: "gate";    headline: string; link?: string };
export type VignetteContent = { type: "vignette"; text: string };
export type ViewContent    = { type: "view";    lines: string[] };

export type LocationContent = PanelContent | GateContent | VignetteContent | ViewContent;

export type Location = {
  id: string;
  name: string;
  y: number;
  phase: "ascent" | "descent";
  visualType: VisualType;
  interactionType: InteractionType;
  proximityRadius: number;
  content: LocationContent;
};

export const LOCATIONS: Location[] = [
  // ── ASCENT ────────────────────────────────────────────────────────────────
  {
    id: "base-camp",
    name: "Base Camp",
    y: 2,
    phase: "ascent",
    visualType: "campfire",
    interactionType: "view",
    proximityRadius: 5,
    content: { type: "view", lines: ["Base Camp.", "The climb starts here."] },
  },
  {
    id: "prism-ledge",
    name: "Prism Ledge",
    y: 14,
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
    },
  },
  {
    id: "agent-cave",
    name: "Agent Cave",
    y: 24,
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
    },
  },
  {
    id: "leaguelads-crag",
    name: "LeagueLads Crag",
    y: 32,
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
    },
  },
  {
    id: "bjj-ledge",
    name: "BJJ Training Ledge",
    y: 40,
    phase: "ascent",
    visualType: "bjj-gear",
    interactionType: "vignette",
    proximityRadius: 5,
    content: {
      type: "vignette",
      text: "10th Planet Pasadena.\n104 classes.\nOn the mat before the product gets built.",
    },
  },
  {
    id: "scout-perch",
    name: "Scout Perch",
    y: 50,
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
    },
  },
  {
    id: "seedling-outcrop",
    name: "Seedling Outcrop",
    y: 62,
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
    },
  },
  {
    id: "community-approach",
    name: "Community Approach",
    y: 74,
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
    },
  },

  // ── DESCENT ───────────────────────────────────────────────────────────────
  {
    id: "gate-001",
    name: "Issue Gate 001",
    y: 68,
    phase: "descent",
    visualType: "slalom-gate",
    interactionType: "gate",
    proximityRadius: 8,
    content: {
      type: "gate",
      headline: "Issue #001 — What I learned building an AI agent from scratch",
      link: "https://sleepingemployees.com",
    },
  },
  {
    id: "gate-002",
    name: "Issue Gate 002",
    y: 50,
    phase: "descent",
    visualType: "slalom-gate",
    interactionType: "gate",
    proximityRadius: 8,
    content: {
      type: "gate",
      headline: "Issue #002 — The portfolio that builds itself",
      link: "https://sleepingemployees.com",
    },
  },
  {
    id: "about-slope",
    name: "About Slope",
    y: 30,
    phase: "descent",
    visualType: "snow-text",
    interactionType: "view",
    proximityRadius: 10,
    content: {
      type: "view",
      lines: [
        "14 years building.",
        "1 kid. Infinite problems to solve.",
        "Not an expert. Someone doing the work.",
      ],
    },
  },
  {
    id: "contact-landing",
    name: "Contact Landing",
    y: 2,
    phase: "descent",
    visualType: "lit-ground",
    interactionType: "contact",
    proximityRadius: 8,
    content: {
      type: "contact",
      title: "Working on something?",
      description: "Let's build it together.",
      email: "manu@manuramchandani.com",
      linkLabel: "Send me a message",
    },
  },
];
