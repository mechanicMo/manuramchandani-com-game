export type BeaconHintType = "proximity" | "altitude" | "idle";

export type BeaconHint = {
  id: string;
  type: BeaconHintType;
  text: string;
  yThreshold?: number;
};

// One per location id — fires within 8 units of loc.y
export const PROXIMITY_HINTS: Record<string, BeaconHint> = {
  "face-carving": {
    id: "prox-face-carving",
    type: "proximity",
    text: "That stone carving — that's Manu. Press [E] to reach out.",
  },
  "base-camp": {
    id: "prox-base-camp",
    type: "proximity",
    text: "Base camp. This is where everything starts. The mountain is ahead.",
  },
  "prism-ledge": {
    id: "prox-prism-ledge",
    type: "proximity",
    text: "Prism Ledge. 15 modules, zero mocks. Press [E] to look closer.",
  },
  "agent-cave": {
    id: "prox-agent-cave",
    type: "proximity",
    text: "Agent Cave — this thing runs while Manu sleeps. Creepy efficient.",
  },
  "meal-planner-ledge": {
    id: "prox-meal-planner-ledge",
    type: "proximity",
    text: "Meal Planner — snap a receipt, get a week of recipes. Flutter + Gemini.",
  },
  "leaguelads-crag": {
    id: "prox-leaguelads-crag",
    type: "proximity",
    text: "LeagueLads Crag. Live team comp analysis for League players.",
  },
  "workshops-shelf": {
    id: "prox-workshops-shelf",
    type: "proximity",
    text: "Workshops — e-learning platform he built to teach what he knows.",
  },
  "bjj-ledge": {
    id: "prox-bjj-ledge",
    type: "proximity",
    text: "BJJ Ledge. 104 classes. On the mat before the product gets built.",
  },
  "scout-perch": {
    id: "prox-scout-perch",
    type: "proximity",
    text: "Scout Perch — up here, you can see everything worth watching.",
  },
  "seedling-outcrop": {
    id: "prox-seedling-outcrop",
    type: "proximity",
    text: "Seedling. Built for kids learning ASL. Small app, real care.",
  },
  "community-approach": {
    id: "prox-community-approach",
    type: "proximity",
    text: "Community — almost to the summit. Map-first volunteering app.",
  },
  "contact-landing": {
    id: "prox-contact-landing",
    type: "proximity",
    text: "You made it down. Say hi — he actually responds.",
  },
};

// Fired when character crosses yThreshold going upward. One-shot per session.
export const ALTITUDE_HINTS: BeaconHint[] = [
  {
    id: "alt-10",
    type: "altitude",
    yThreshold: 10,
    text: "First pitch done. Mountain opens up from here.",
  },
  {
    id: "alt-25",
    type: "altitude",
    yThreshold: 25,
    text: "Halfway to the cave. Good pace.",
  },
  {
    id: "alt-45",
    type: "altitude",
    yThreshold: 45,
    text: "Crux zone. Projects get deeper from here.",
  },
  {
    id: "alt-65",
    type: "altitude",
    yThreshold: 65,
    text: "Summit's close. Don't stop now.",
  },
  {
    id: "alt-80",
    type: "altitude",
    yThreshold: 80,
    text: "Summit. Light the beacon — boards are waiting.",
  },
];

// Rotate through in order after 15s of no movement
export const IDLE_HINTS: BeaconHint[] = [
  {
    id: "idle-0",
    type: "idle",
    text: "Look around. Some of the best things are off the main path.",
  },
  {
    id: "idle-1",
    type: "idle",
    text: "Taking a break? The mountain has time.",
  },
  {
    id: "idle-2",
    type: "idle",
    text: "WASD or arrow keys move. SPACE jumps. Press C to chat with me.",
  },
  {
    id: "idle-3",
    type: "idle",
    text: "Try pressing ? — I have a full shortcut map.",
  },
  {
    id: "idle-4",
    type: "idle",
    text: "There are a few hidden things on this mountain. Worth exploring.",
  },
];
