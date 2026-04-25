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
  | "lit-ground"
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
};

export type ContactContent = {
  type: "contact";
  title: string;
  description: string;
  email: string;
  linkLabel?: string;
};

export type GateContent    = { type: "gate";    headline: string; link?: string };
export type VignetteContent = { type: "vignette"; text: string };
export type ViewContent    = { type: "view";    lines: string[] };

export type LocationContent = PanelContent | GateContent | VignetteContent | ViewContent | ContactContent;

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
    },
  },
  {
    id: "leaguelads-crag",
    name: "LeagueLads Crag",
    x: 12,
    y: 32,
    z: 38,
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
    x: -12,
    y: 40,
    z: 38,
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
    },
  },
  {
    id: "community-approach",
    name: "Community Approach",
    x: 12,
    y: 74,
    z: 38,
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

  // ── TRAIL MARKERS — personal milestone plaques, Y gaps between project stops ─
  {
    id: "marker-2012", name: "2012",
    x: 8, y: 9, z: 39,
    phase: "ascent", visualType: "plaque", interactionType: "vignette", proximityRadius: 5,
    content: { type: "vignette", text: "2012\nStarted developing software." },
  },
  {
    id: "marker-2015", name: "2015",
    x: -8, y: 19, z: 39,
    phase: "ascent", visualType: "plaque", interactionType: "vignette", proximityRadius: 5,
    content: { type: "vignette", text: "2015\nFirst professional dev job." },
  },
  {
    id: "marker-2018", name: "2018",
    x: 8, y: 27, z: 39,
    phase: "ascent", visualType: "plaque", interactionType: "vignette", proximityRadius: 5,
    content: { type: "vignette", text: "2018\nFirst shipped product." },
  },
  {
    id: "marker-2020", name: "2020",
    x: -8, y: 36, z: 39,
    phase: "ascent", visualType: "plaque", interactionType: "vignette", proximityRadius: 5,
    content: { type: "vignette", text: "2020\nGot married." },
  },
  {
    id: "marker-2024", name: "2024",
    x: 8, y: 44, z: 39,
    phase: "ascent", visualType: "plaque", interactionType: "vignette", proximityRadius: 5,
    content: { type: "vignette", text: "2024\nStarted BJJ. 10th Planet Pasadena." },
  },
  {
    id: "marker-2025", name: "2025",
    x: -8, y: 55, z: 39,
    phase: "ascent", visualType: "plaque", interactionType: "vignette", proximityRadius: 5,
    content: { type: "vignette", text: "2025\nWent freelance. Stay-at-home dad." },
  },
  {
    id: "marker-2026", name: "2026",
    x: 8, y: 67, z: 39,
    phase: "ascent", visualType: "plaque", interactionType: "vignette", proximityRadius: 5,
    content: { type: "vignette", text: "2026\nSherani born." },
  },

  // ── DESCENT ───────────────────────────────────────────────────────────────
  {
    id: "gate-001",
    name: "Issue Gate 001",
    x: 8,
    y: 68,
    z: -14,
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
    x: -8,
    y: 50,
    z: -34,
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
    x: 0,
    y: 30,
    z: -55,
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
    x: 0,
    y: 2,
    z: -83,
    phase: "descent",
    visualType: "lit-ground",
    interactionType: "contact",
    proximityRadius: 14,
    content: {
      type: "contact",
      title: "Working on something?",
      description: "Let's build it together.",
      email: "manu@manuramchandani.com",
      linkLabel: "Send me a message",
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
      linkLabel: "Send a message",
    },
  },
  {
    id: "snowboard-cache",
    name: "Snowboard Cache",
    x: 0, y: 82, z: 4,
    phase: "summit",
    visualType: "snowboard-rack",
    interactionType: "view",
    proximityRadius: 4,
    content: { type: "view", lines: ["The descent awaits.", "Press SPACE to drop in."] },
  },
];
