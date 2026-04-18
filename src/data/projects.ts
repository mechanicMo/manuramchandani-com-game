// src/data/projects.ts
export type Screenshot = { src: string; caption: string };

export type Project = {
  slug: string;
  name: string;
  type: 'web' | 'mobile' | 'agent';
  status: 'live' | 'beta' | 'in-development';
  tag: string;
  tagColor: string;
  tagBg: string;
  shortDesc: string;
  fullDesc: string;
  url?: string;
  platform?: string;
  screenshots?: Screenshot[];
  problem?: string;
  stack?: string[];
  whatShipped?: string;
  whatWasHard?: string;
};

export const projects: Project[] = [
  {
    slug: 'prism',
    name: 'Prism',
    type: 'web',
    status: 'live',
    tag: 'Live',
    tagColor: '#2D6A4F',
    tagBg: '#D8F3DC',
    shortDesc: 'Production SaaS demo with 15 fully built modules — real integrations, zero mocks.',
    fullDesc: 'Production SaaS demo with 15 fully built modules — auth, analytics, data tables, e-commerce, Kanban, file storage, AI chat with streaming, a Snake game with a global leaderboard, and more. Real integrations, zero mocks.',
    url: 'https://prism.manuramchandani.com',
    stack: ['React', 'TypeScript', 'Supabase', 'Cloudflare Workers', 'Stripe', 'OpenAI'],
    problem: "Clients asking \"can you show me something real?\" needed a single link that proved full-stack capability across every common SaaS pattern.",
    whatShipped: '15 independent modules — auth, analytics dashboard, data tables, e-commerce flow, Kanban, file uploads, AI chat with streaming, Snake with real-time global leaderboard.',
    whatWasHard: 'Making 15 modules feel like one coherent product. The global nav and shared auth state had to work seamlessly across every module without coupling their internals.',
  },
  {
    slug: 'leaguelads',
    name: 'LeagueLads',
    type: 'web',
    status: 'live',
    tag: 'Live',
    tagColor: '#2D6A4F',
    tagBg: '#D8F3DC',
    shortDesc: 'League of Legends companion — live champion pick coordination and team comp analysis.',
    fullDesc: "League of Legends companion — live champion pick coordination, team comp suggestions, and in-game tips powered by Riot's API.",
    url: 'https://leaguelads.manuramchandani.com',
    stack: ['React', 'Riot Games API', 'Cloudflare Pages'],
    problem: 'In-game champion picks happen fast. Teams need instant comp analysis and counter suggestions without leaving the game to Google.',
    whatShipped: 'Real-time champion pick coordination with live Riot API data, team comp analysis, in-game tip panels.',
    whatWasHard: "Riot API rate limits and stateful pick/ban coordination between players.",
  },
  {
    slug: 'seedling',
    name: 'Seedling',
    type: 'mobile',
    status: 'beta',
    tag: 'Beta',
    tagColor: '#2D6A4F',
    tagBg: '#D8F3DC',
    shortDesc: 'Neurodivergent-first learning app for young kids. Stories with ASL, teaching games, and AI parent guidance.',
    fullDesc: "Seedling is a learning app for preschool and early elementary kids, built neurodivergent-first — defaults, not add-ons. Kids get stories read aloud with word-by-word highlighting, seven teaching games that show how to find the answer rather than just the answer, and an ASL-signing octopus named Zee. Parents get a library of research-backed guides for the hard moments, an AI companion that answers real questions and cites its sources, and a session report after every use. Built in Flutter and Firebase.",
    platform: 'Flutter · iOS & Android',
    screenshots: [
      { src: '/seedling/home.jpeg', caption: 'Parent home' },
      { src: '/seedling/activities.jpeg', caption: "Kid's activities" },
      { src: '/seedling/story-asl.jpeg', caption: 'Stories with ASL' },
      { src: '/seedling/report.jpeg', caption: 'Session report' },
    ],
    stack: ['Flutter', 'Firebase', 'Gemini AI', 'ElevenLabs'],
    problem: 'Most kids learning apps are designed for neurotypical children. Neurodivergent kids and their parents have different needs.',
    whatShipped: 'Stories with word-by-word audio + ASL signing, 7 teaching games with pedagogical hints, AI parent companion with source citations, session reports.',
    whatWasHard: "Building the pedagogical hint system — showing how to find the answer rather than the answer itself requires a careful state machine per game type.",
  },
  {
    slug: 'scout',
    name: 'Scout',
    type: 'mobile',
    status: 'beta',
    tag: 'Beta',
    tagColor: '#2D6A4F',
    tagBg: '#D8F3DC',
    shortDesc: 'TV and movie discovery with AI-ranked picks and natural-language mood search.',
    fullDesc: "Scout is a TV and movie discovery app for people who want something better than 'the algorithm.' Tell it what you're in the mood for and it returns ranked picks from across the streaming landscape. Swipe left to pass, right to add. A proper watchlist with in-progress tracking. Built in React Native with Cloudflare Workers and Llama 70B.",
    platform: 'React Native · iOS & Android',
    stack: ['React Native', 'Cloudflare Workers', 'Groq / Llama 70B', 'Supabase', 'TMDB API'],
    problem: "Streaming platform algorithms optimize for their own catalog, not what you want. Natural language mood search doesn't exist anywhere.",
    whatShipped: 'Natural language mood search, AI-ranked picks via Llama 70B, swipe-to-triage, watchlist with in-progress tracking.',
    whatWasHard: "Prompt engineering for ranked results that feel editorial. Getting Llama to understand nuanced mood descriptions required many iterations.",
  },
  {
    slug: 'community',
    name: 'Community',
    type: 'mobile',
    status: 'in-development',
    tag: 'In Development',
    tagColor: '#7B5E00',
    tagBg: '#FFF3CD',
    shortDesc: 'Map-first volunteering app for neighbors. Post a need, find someone nearby.',
    fullDesc: "Community is a map-first volunteering app. Post a help request on the map; anyone nearby can sign up. Volunteers earn a community score: cumulative points plus a live A-F behavior grade, visible right on their map pin.",
    platform: 'React Native · iOS & Android',
    stack: ['React Native', 'Supabase', 'PostGIS', 'Expo'],
    problem: 'No easy way to post a specific need and find a vetted neighbor who can help.',
    whatShipped: 'Map view with PostGIS radius queries, task posting flow, volunteer signup, community score system with A-F grade.',
    whatWasHard: "PostGIS radius queries at scale while keeping the map fast. The community score formula needed to balance recency, volume, and rating quality.",
  },
  {
    slug: 'sleeping-employees',
    name: 'Sleeping Employees',
    type: 'agent',
    status: 'live',
    tag: 'Live',
    tagColor: '#2D6A4F',
    tagBg: '#D8F3DC',
    shortDesc: 'AI agent that monitors Upwork and submits tailored proposals autonomously.',
    fullDesc: "Sleeping Employees is an AI agent system running on a Mac Mini that monitors Upwork job postings, scores them against a preference profile, and submits tailored proposals autonomously. It runs overnight and on weekends — bidding while I sleep.",
    platform: 'Node.js · Mac Mini · Anthropic Claude API',
    url: 'https://sleepingemployees.com',
    stack: ['Node.js', 'Claude API', 'Playwright', 'Mac Mini (always-on)'],
    problem: "Upwork bidding is a volume game. Manual bidding limits you to a few proposals per day. An agent can do 3-5 thoughtful bids per day, 7 days a week.",
    whatShipped: 'Job scraping + scoring pipeline, proposal generation with Claude, autonomous submission via Playwright, newsletter at sleepingemployees.com.',
    whatWasHard: "Scoring accuracy — too many false positives means wasted proposals. Proposal quality had to match or exceed what I'd write manually.",
  },
];

export const mobileProjects = projects.filter(p => p.type === 'mobile');
export const webProjects    = projects.filter(p => p.type === 'web');
export const agentProjects  = projects.filter(p => p.type === 'agent');
