export type BeaconHintType = "proximity" | "altitude" | "idle";

export type BeaconHint = {
  id: string;
  type: BeaconHintType;
  text: string;
  yThreshold?: number;
};

// One per location id — fires within 8 units of loc.y
export const PROXIMITY_HINTS: Record<string, BeaconHint> = {
  "base-camp": {
    id: "prox-base-camp",
    type: "proximity",
    text: "Base camp. Deep breath — the wall is ahead.",
  },
  "prism-ledge": {
    id: "prox-prism-ledge",
    type: "proximity",
    text: "Prism Ledge. 15 modules, zero mocks. Hit Enter to look.",
  },
  "agent-cave": {
    id: "prox-agent-cave",
    type: "proximity",
    text: "Agent Cave — this thing runs while Manu sleeps. Creepy efficient.",
  },
  "leaguelads-crag": {
    id: "prox-leaguelads-crag",
    type: "proximity",
    text: "LeagueLads Crag. Real-time team comp analysis. Challengers only.",
  },
  "bjj-ledge": {
    id: "prox-bjj-ledge",
    type: "proximity",
    text: "BJJ Ledge. 104 classes and counting. On the mat before the product.",
  },
  "scout-perch": {
    id: "prox-scout-perch",
    type: "proximity",
    text: "Scout Perch — up here, you can see everything worth watching.",
  },
  "seedling-outcrop": {
    id: "prox-seedling-outcrop",
    type: "proximity",
    text: "Seedling Outcrop. Built for kids learning ASL. Small app, big care.",
  },
  "community-approach": {
    id: "prox-community-approach",
    type: "proximity",
    text: "Community Approach — almost to the summit. Map-first volunteering.",
  },
  "gate-001": {
    id: "prox-gate-001",
    type: "proximity",
    text: "Gate 001 coming up. Carve through it. Don't blow it.",
  },
  "gate-002": {
    id: "prox-gate-002",
    type: "proximity",
    text: "Gate 002 — lean into it. You've got this.",
  },
  "about-slope": {
    id: "prox-about-slope",
    type: "proximity",
    text: "About Slope. This is the real stuff. Slow down.",
  },
  "contact-landing": {
    id: "prox-contact-landing",
    type: "proximity",
    text: "Contact Landing! You made it down. Say hi — he actually responds.",
  },
};

// Fired when character crosses yThreshold going upward. One-shot per session.
export const ALTITUDE_HINTS: BeaconHint[] = [
  {
    id: "alt-10",
    type: "altitude",
    yThreshold: 10,
    text: "First pitch done. The cliff opens up from here.",
  },
  {
    id: "alt-20",
    type: "altitude",
    yThreshold: 20,
    text: "Halfway to the cave. Watch your footing.",
  },
  {
    id: "alt-40",
    type: "altitude",
    yThreshold: 40,
    text: "Y=40 — crux zone. Projects are getting deeper from here.",
  },
  {
    id: "alt-60",
    type: "altitude",
    yThreshold: 60,
    text: "Summit's close. Three more ledges — don't look down.",
  },
  {
    id: "alt-80",
    type: "altitude",
    yThreshold: 80,
    text: "Summit! Press SPACE to start the descent. Boards waiting.",
  },
];

// Rotate through in order after 15s of no movement
export const IDLE_HINTS: BeaconHint[] = [
  {
    id: "idle-0",
    type: "idle",
    text: "Take a look around. Some of the best holds are off the beaten path.",
  },
  {
    id: "idle-1",
    type: "idle",
    text: "Resting? Fair. The climb is relentless.",
  },
  {
    id: "idle-2",
    type: "idle",
    text: "Arrow keys move. SPACE jumps to the next hold. C opens my full intel.",
  },
  {
    id: "idle-3",
    type: "idle",
    text: "Still here? Try pressing ? — I have a full shortcut map.",
  },
  {
    id: "idle-4",
    type: "idle",
    text: "The wall doesn't wait. Keep climbing.",
  },
];
