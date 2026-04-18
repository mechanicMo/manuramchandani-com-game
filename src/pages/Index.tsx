import { useState, useEffect, useRef } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

// ─── Hooks ────────────────────────────────────────────────────────────────────

const useTypewriter = (text: string, speed = 38, startDelay = 400) => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const start = setTimeout(() => {
      let i = 0;
      const timer = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          setDone(true);
          clearInterval(timer);
        }
      }, speed);
      return () => clearInterval(timer);
    }, startDelay);
    return () => clearTimeout(start);
  }, [text, speed, startDelay]);

  return { displayed, done };
};

const useInView = (threshold = 0.12) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
};

// ─── Data ────────────────────────────────────────────────────────────────────

const pillars = [
  {
    label: "Web Products",
    body: "Full-stack web development across the whole stack. React, Node, databases, third-party integrations. I've shipped consumer products, internal tools, e-commerce platforms, and SaaS apps — from zero to production and through every iteration after.",
  },
  {
    label: "AI Agents",
    body: "Building agents that do real work: automated pipelines, proposal systems, document processing, and decision-making workflows. Not demos — things running in production, making decisions, processing data overnight while I sleep.",
  },
  {
    label: "Mobile Apps",
    body: "Native-quality mobile apps in Flutter and React Native. Parental controls, content discovery, community tools. Multiple apps in active development, each solving a specific problem for a specific person.",
  },
];

const webProjects = [
  {
    name: "Prism",
    desc: "Production SaaS demo with 15 fully built modules — auth, analytics, data tables, e-commerce, Kanban, file storage, AI chat with streaming, a Snake game with a global leaderboard, and more. Real integrations, zero mocks.",
    url: "https://prism.manuramchandani.com",
  },
  {
    name: "LeagueLads",
    desc: "League of Legends companion — live champion pick coordination, team comp suggestions, and in-game tips powered by Riot's API.",
    url: "https://leaguelads.manuramchandani.com",
  },
];

type Screenshot = { src: string; caption: string };

type MobileProject = {
  name: string;
  tag: string;
  tagColor: string;
  tagBg: string;
  desc: string;
  fullDesc: string;
  platform: string;
  screenshots?: Screenshot[];
};

const mobileProjects: MobileProject[] = [
  {
    name: "Seedling",
    tag: "Beta",
    tagColor: "#2D6A4F",
    tagBg: "#D8F3DC",
    desc: "Neurodivergent-first learning app for young kids. Stories with word-by-word highlighting and ASL, teaching games with pedagogical hints, and AI parent guidance grounded in child development research.",
    fullDesc: "Seedling is a learning app for preschool and early elementary kids, built neurodivergent-first — defaults, not add-ons. Kids get stories read aloud with word-by-word highlighting, seven teaching games that show how to find the answer rather than just the answer, and an ASL-signing octopus named Zee. Parents get a library of research-backed guides for the hard moments (tantrums, transitions, separation anxiety), an AI companion that answers real questions and cites its sources, and a session report after every use with concrete follow-up ideas you can try together. Built in Flutter and Firebase. Designed by a parent, for parents.",
    platform: "Flutter · iOS & Android",
    screenshots: [
      { src: "/seedling/home.jpeg", caption: "Parent home" },
      { src: "/seedling/activities.jpeg", caption: "Kid's activities" },
      { src: "/seedling/story-asl.jpeg", caption: "Stories with ASL" },
      { src: "/seedling/report.jpeg", caption: "Session report" },
    ],
  },
  {
    name: "Scout",
    tag: "Beta",
    tagColor: "#2D6A4F",
    tagBg: "#D8F3DC",
    desc: "TV and movie discovery with AI-ranked picks, natural-language mood search, and a real watchlist. Swipe to triage, tap to track what you're watching.",
    fullDesc: "Scout is a TV and movie discovery app for people who want something better than 'the algorithm.' Tell it what you're in the mood for — 'something weird and hopeful, under 90 minutes' — and it returns ranked picks from across the streaming landscape. The Picks feed learns from what you dismiss and what you keep. Swipe left to pass, right to add. A proper watchlist with sort, type and genre filters, and actual in-progress tracking (tap S1 · E1 to edit). Built in React Native with an AI pipeline running on Cloudflare Workers and a Groq-powered Llama 70B model doing the ranking.",
    platform: "React Native · iOS & Android",
  },
  {
    name: "Community",
    tag: "In Development",
    tagColor: "#7B5E00",
    tagBg: "#FFF3CD",
    desc: "Map-first volunteering app for neighbors. Post a help request, find someone nearby who can do it. Real accountability through community scores and peer grading.",
    fullDesc: "Community is a map-first volunteering app built on the idea that neighbors still help neighbors — you just need a way to find each other. Post a help request on the map (ride to the train, help moving a couch, painting a fence); anyone nearby can sign up. After the task, the poster rates the volunteer. Volunteers earn a community score: cumulative points plus a live A-F behavior grade, visible right on their map pin. Browse anonymously, sign up when you're ready to commit. Built in React Native with a PostGIS-backed Supabase for the location layer.",
    platform: "React Native · iOS & Android",
  },
];

// TODO: Add issue 003 once title/URL confirmed; add URL for 001 when available
const newsletterIssues = [
  {
    num: "002",
    title: "The Full Loop",
    date: "Apr 7, 2026",
    url: "https://sleepingemployees.com/p/the-full-loop",
  },
  {
    num: "001",
    title: "What AI agents are actually doing for real people",
    date: "Mar 31, 2026",
    url: "https://sleepingemployees.com/p/the-businesses-running-on-autopilot",
  },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const serif = "'Playfair Display', Georgia, serif";
const sans = "'Inter', system-ui, sans-serif";
const mono = "'DM Mono', 'Menlo', monospace";

const colors = {
  bg: "#FAF8F4",
  text: "#1A1A1A",
  muted: "#6B6B5E",
  faint: "#9A9A8E",
  rule: "#E0DCD4",
  amber: "#C8860A",
  amberLight: "#FBF3E4",
  card: "#FFFFFF",
};

// ─── Component ────────────────────────────────────────────────────────────────

const Index = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [activeModal, setActiveModal] = useState<MobileProject | null>(null);
  const isMobile = useIsMobile();

  const { displayed: typewriterText, done: typewriterDone } = useTypewriter(
    "Products that ship, agents that run, apps people actually use."
  );

  const pillarsInView = useInView();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  // Close modal on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setActiveModal(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div style={{ backgroundColor: colors.bg, color: colors.text, minHeight: "100vh" }}>

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px 72px" }}>
        <h1
          style={{
            fontFamily: serif,
            fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
            lineHeight: 1.08,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            marginBottom: 24,
            maxWidth: 580,
          }}
        >
          I build software.
          <br />
          <span
            style={{
              fontWeight: 400,
              color: colors.muted,
              fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)",
              display: "inline-block",
              minHeight: "1.3em",
            }}
          >
            {typewriterText}
            <span
              style={{
                display: "inline-block",
                width: 2,
                height: "0.85em",
                backgroundColor: colors.amber,
                marginLeft: 3,
                verticalAlign: "middle",
                animation: typewriterDone ? "none" : "blink 0.7s step-end infinite",
                opacity: typewriterDone ? 0 : 1,
              }}
            />
          </span>
        </h1>

        <p
          style={{
            fontFamily: sans,
            fontSize: "1.05rem",
            lineHeight: 1.7,
            color: colors.muted,
            maxWidth: 520,
            marginBottom: 40,
          }}
        >
          14 years of web development. Now building AI agents, mobile apps, and
          web products — and writing about what actually works.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 480 }}>

          {/* Primary: contact — outline style */}
          <a
            href="mailto:hello@manuramchandani.com"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              height: 48,
              paddingInline: 24,
              borderRadius: 6,
              border: `1.5px solid ${colors.text}`,
              backgroundColor: "transparent",
              color: colors.text,
              fontFamily: sans,
              fontSize: "0.875rem",
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              textDecoration: "none",
              width: "fit-content",
              transition: "background-color 0.15s, color 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = colors.text;
              e.currentTarget.style.color = colors.bg;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = colors.text;
            }}
          >
            Get in touch
            <ArrowUpRight size={15} />
          </a>

          {/* Secondary: newsletter — amber filled */}
          <div>
            <p
              style={{
                fontFamily: sans,
                fontSize: "0.875rem",
                color: colors.muted,
                marginBottom: 8,
              }}
            >
              Subscribe to Sleeping Employees — my weekly dispatch on AI agents
            </p>

            {status === "success" ? (
              <p style={{ fontFamily: sans, fontSize: "0.9rem", color: colors.amber, fontWeight: 500 }}>
                You're on the list.
              </p>
            ) : (
              <form onSubmit={handleSubscribe} style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8 }}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    height: 48,
                    paddingInline: 16,
                    borderRadius: 6,
                    border: `1px solid ${colors.rule}`,
                    backgroundColor: colors.card,
                    fontFamily: sans,
                    fontSize: "1rem",
                    color: colors.text,
                    outline: "none",
                    minWidth: 0,
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = colors.amber)}
                  onBlur={e => (e.currentTarget.style.borderColor = colors.rule)}
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  style={{
                    height: 48,
                    paddingInline: 24,
                    borderRadius: 6,
                    border: "none",
                    backgroundColor: colors.amber,
                    color: "#FFFFFF",
                    fontFamily: sans,
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    opacity: status === "loading" ? 0.7 : 1,
                    transition: "opacity 0.15s",
                    width: isMobile ? "100%" : undefined,
                    flexShrink: 0,
                  }}
                >
                  {status === "loading" ? "..." : "Subscribe"}
                </button>
              </form>
            )}

            {status === "error" && (
              <p style={{ fontFamily: sans, fontSize: "0.8rem", color: "#C0392B", marginTop: 6 }}>
                Something went wrong. Try again.
              </p>
            )}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── What I build ──────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "72px 24px" }}>
        <h2
          style={{
            fontFamily: serif,
            fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
            fontWeight: 700,
            marginBottom: 48,
            color: colors.text,
          }}
        >
          What I build.
        </h2>

        <div
          ref={pillarsInView.ref}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "32px 48px",
          }}
        >
          {pillars.map((p, i) => (
            <div
              key={p.label}
              style={{
                opacity: pillarsInView.inView ? 1 : 0,
                transform: pillarsInView.inView ? "translateY(0)" : "translateY(24px)",
                transition: `opacity 0.5s ease ${i * 120}ms, transform 0.5s ease ${i * 120}ms`,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 2,
                  backgroundColor: colors.amber,
                  marginBottom: 16,
                  transition: "width 0.3s ease",
                }}
                onMouseEnter={e => (e.currentTarget.style.width = "48px")}
                onMouseLeave={e => (e.currentTarget.style.width = "32px")}
              />
              <h3
                style={{
                  fontFamily: serif,
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  marginBottom: 10,
                  color: colors.text,
                }}
              >
                {p.label}
              </h3>
              <p style={{ fontFamily: sans, fontSize: "0.9rem", lineHeight: 1.75, color: colors.muted }}>
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── Live projects ─────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "72px 24px" }}>
        <h2
          style={{
            fontFamily: serif,
            fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
            fontWeight: 700,
            marginBottom: 48,
          }}
        >
          Live projects.
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          {webProjects.map(p => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none", display: "block" }}
            >
              <div
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.rule}`,
                  borderRadius: 8,
                  padding: "24px 24px 20px",
                  transition: "border-color 0.15s, transform 0.2s",
                  cursor: "pointer",
                  height: "100%",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = colors.amber;
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = colors.rule;
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <span style={{ fontFamily: sans, fontWeight: 600, fontSize: "1rem", color: colors.text }}>{p.name}</span>
                  <ArrowUpRight size={15} color={colors.amber} />
                </div>
                <p style={{ fontFamily: sans, fontSize: "0.85rem", lineHeight: 1.65, color: colors.muted, margin: "0 0 16px" }}>
                  {p.desc}
                </p>
                <StatusTag label="Live" color="#2D6A4F" bg="#D8F3DC" />
              </div>
            </a>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── Mobile apps ───────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "72px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 48 }}>
          <h2 style={{ fontFamily: serif, fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 700 }}>
            Mobile apps.
          </h2>
          <p style={{ fontFamily: mono, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: colors.faint }}>
            iOS & Android
          </p>
        </div>
        <p style={{ fontFamily: sans, fontSize: "0.875rem", color: colors.faint, marginBottom: 28, marginTop: -28 }}>
          {isMobile ? "Tap" : "Click"} any card to learn more.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          {mobileProjects.map(p => (
            <button
              key={p.name}
              onClick={() => setActiveModal(p)}
              style={{
                all: "unset",
                display: "block",
                textAlign: "left",
                cursor: "pointer",
                width: "100%",
              }}
            >
              <div
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.rule}`,
                  borderRadius: 8,
                  padding: "24px 24px 20px",
                  transition: "border-color 0.15s, transform 0.2s",
                  height: "100%",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = colors.amber;
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = colors.rule;
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <span style={{ fontFamily: sans, fontWeight: 600, fontSize: "1rem", color: colors.text }}>{p.name}</span>
                  <StatusTag label={p.tag} color={p.tagColor} bg={p.tagBg} />
                </div>
                <p style={{ fontFamily: sans, fontSize: "0.85rem", lineHeight: 1.65, color: colors.muted, margin: "0 0 14px" }}>
                  {p.desc}
                </p>
                <p style={{ fontFamily: mono, fontSize: "10px", letterSpacing: "0.06em", color: colors.faint, textTransform: "uppercase" }}>
                  {p.platform}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── About ─────────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "72px 24px" }}>
        <h2 style={{ fontFamily: serif, fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 700, marginBottom: 48 }}>
          About.
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 160px) 1fr",
            gap: isMobile ? 32 : "32px 56px",
          }}
        >
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "row" : "column",
            gap: isMobile ? 0 : 28,
            justifyContent: isMobile ? "space-between" : undefined,
          }}>
            {[
              { val: "14", label: "years building for the web" },
              { val: "1", label: "wedding officiated" },
              { val: "∞", label: "things to figure out" },
            ].map(s => (
              <div key={s.val} style={{ flex: isMobile ? "1 1 0" : undefined, textAlign: isMobile ? "center" : undefined }}>
                <div style={{ fontFamily: serif, fontSize: isMobile ? "2.4rem" : "3rem", fontWeight: 700, color: colors.amber, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontFamily: sans, fontSize: "0.75rem", color: colors.faint, marginTop: 4, lineHeight: 1.4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ fontFamily: sans, fontSize: "0.95rem", lineHeight: 1.8, color: colors.muted, display: "flex", flexDirection: "column", gap: 16 }}>
            <p>
              I'm Manu Ramchandani, a developer and builder based in Pasadena, California.
              Fourteen years building web products, leading engineering teams, and shipping things
              that real people use.
            </p>
            <p>
              These days I'm building AI agents, mobile apps, and web products — mostly in public,
              mostly while figuring it out in real time. I'm interested in the gap between what AI
              can theoretically do and what it actually does when you put it to work.
            </p>
            <p style={{ color: colors.text, fontWeight: 500 }}>
              Not an expert. Someone doing the work.
            </p>
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Newsletter ────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "72px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
          <h2 style={{ fontFamily: serif, fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 700 }}>
            Also, I write.
          </h2>
          <a
            href="https://sleepingemployees.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontFamily: sans,
              fontSize: "0.85rem",
              fontWeight: 500,
              color: colors.amber,
              textDecoration: "none",
            }}
          >
            sleepingemployees.com
            <ArrowUpRight size={13} />
          </a>
        </div>
        <p style={{ fontFamily: sans, fontSize: "0.9rem", lineHeight: 1.7, color: colors.muted, maxWidth: 480, marginBottom: 40 }}>
          <em>Sleeping Employees</em> — a weekly dispatch on AI agents and real outcomes.
          Not hot takes, not predictions. Notes from someone in the middle of it.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {newsletterIssues.map((issue, i) => {
            const rowContent = (
              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: isMobile ? "stretch" : "baseline",
                  gap: isMobile ? 6 : 16,
                  padding: "16px 0",
                  borderTop: i === 0 ? `1px solid ${colors.rule}` : undefined,
                  borderBottom: `1px solid ${colors.rule}`,
                  transition: "background-color 0.15s",
                  cursor: issue.url ? "pointer" : "default",
                }}
                onMouseEnter={e => { if (issue.url) (e.currentTarget as HTMLDivElement).style.backgroundColor = colors.amberLight; }}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent"}
              >
                {isMobile ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontFamily: mono, fontSize: "11px", color: colors.amber, flexShrink: 0 }}>{issue.num}</span>
                      <span style={{ fontFamily: mono, fontSize: "10px", color: colors.faint, flex: 1 }}>{issue.date}</span>
                      {issue.url && <ArrowUpRight size={13} color={colors.faint} style={{ flexShrink: 0 }} />}
                    </div>
                    <span style={{ fontFamily: sans, fontSize: "0.95rem", color: colors.text, lineHeight: 1.5 }}>{issue.title}</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontFamily: mono, fontSize: "11px", color: colors.amber, flexShrink: 0 }}>{issue.num}</span>
                    <span style={{ fontFamily: sans, fontSize: "0.95rem", color: colors.text, flex: 1 }}>{issue.title}</span>
                    <span style={{ fontFamily: mono, fontSize: "10px", color: colors.faint, flexShrink: 0 }}>{issue.date}</span>
                    {issue.url && <ArrowUpRight size={13} color={colors.faint} style={{ flexShrink: 0 }} />}
                  </>
                )}
              </div>
            );

            return issue.url ? (
              <a key={issue.num} href={issue.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                {rowContent}
              </a>
            ) : (
              <div key={issue.num}>{rowContent}</div>
            );
          })}
        </div>
      </section>

      <Divider />

      {/* ── Contact ───────────────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: colors.amberLight, padding: "80px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: serif,
              fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
              fontWeight: 700,
              lineHeight: 1.15,
              marginBottom: 16,
            }}
          >
            Working on something?
            <br />
            <span style={{ fontStyle: "italic", fontWeight: 400 }}>Let's build it together.</span>
          </h2>
          <p style={{ fontFamily: sans, fontSize: "1rem", lineHeight: 1.7, color: colors.muted, maxWidth: 480, marginBottom: 32 }}>
            I take on web development, AI agent projects, and mobile app builds.
            If you have a problem that needs real software, not a template — reach out.
          </p>
          <a
            href="mailto:hello@manuramchandani.com"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: sans,
              fontSize: "1rem",
              fontWeight: 600,
              color: colors.amber,
              textDecoration: "none",
              borderBottom: `2px solid ${colors.amber}`,
              paddingBottom: 2,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            hello@manuramchandani.com
            <ArrowUpRight size={16} />
          </a>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer style={{ maxWidth: 720, margin: "0 auto", padding: "28px 24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: sans, fontWeight: 600, fontSize: "0.875rem", color: colors.text }}>
            Manu Ramchandani
          </span>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
              { label: "GitHub", url: "https://github.com/mechanicMo" },
              { label: "LinkedIn", url: "https://www.linkedin.com/in/manu-mohit-ramchandani/" },
              { label: "Newsletter", url: "https://sleepingemployees.com" },
            ].map(link => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: sans, fontSize: "0.8rem", color: colors.faint, textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = colors.text)}
                onMouseLeave={e => (e.currentTarget.style.color = colors.faint)}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>

      {/* ── Modal ─────────────────────────────────────────────────────────────── */}
      {activeModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 50,
            display: "flex",
            alignItems: isMobile ? "flex-end" : "stretch",
            justifyContent: "center",
            padding: isMobile ? 0 : "0 24px",
          }}
          onClick={() => setActiveModal(null)}
        >
          <div
            style={{
              backgroundColor: colors.bg,
              borderRadius: isMobile ? "16px 16px 0 0" : 14,
              maxWidth: isMobile ? "100%" : 820,
              width: "100%",
              padding: isMobile ? "18px 22px 28px" : "20px 40px 40px",
              position: "relative",
              boxShadow: "0 -4px 40px rgba(0,0,0,0.15)",
              height: isMobile ? "94vh" : "100vh",
              maxHeight: isMobile ? "94vh" : "100vh",
              overflowY: "auto",
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModal(null)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                color: colors.faint,
              }}
            >
              <X size={18} />
            </button>

            {/* Screenshot carousel */}
            {activeModal.screenshots && activeModal.screenshots.length > 0 ? (
              <div
                className="ss-carousel"
                style={{
                  display: "flex",
                  gap: 16,
                  overflowX: "auto",
                  scrollSnapType: "x mandatory",
                  padding: "8px 4px 20px",
                  marginBottom: 8,
                  marginInline: isMobile ? -22 : -40,
                  paddingInline: isMobile ? 22 : 40,
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {activeModal.screenshots.map(shot => (
                  <figure
                    key={shot.src}
                    style={{
                      flex: "0 0 auto",
                      margin: 0,
                      scrollSnapAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        height: isMobile ? "70vh" : "76vh",
                        aspectRatio: "9/19.5",
                        backgroundColor: "#1A1A1A",
                        borderRadius: 42,
                        padding: 10,
                        boxShadow: "0 14px 40px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04) inset",
                        position: "relative",
                      }}
                    >
                      <img
                        src={shot.src}
                        alt={shot.caption}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: 34,
                          display: "block",
                        }}
                      />
                      <span
                        aria-hidden
                        style={{
                          position: "absolute",
                          top: 16,
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: isMobile ? 92 : 110,
                          height: isMobile ? 22 : 26,
                          backgroundColor: "#000",
                          borderRadius: 14,
                        }}
                      />
                    </div>
                    <figcaption
                      style={{
                        fontFamily: mono,
                        fontSize: "10px",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: colors.faint,
                      }}
                    >
                      {shot.caption}
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 20px" }}>
                <div
                  style={{
                    height: isMobile ? "70vh" : "76vh",
                    aspectRatio: "9/19.5",
                    backgroundColor: "#1A1A1A",
                    borderRadius: 42,
                    padding: 10,
                    boxShadow: "0 14px 40px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04) inset",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 34,
                      backgroundColor: colors.amberLight,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: mono,
                        fontSize: "10px",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: colors.faint,
                      }}
                    >
                      Screenshots coming soon
                    </span>
                  </div>
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      top: 16,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: isMobile ? 92 : 110,
                      height: isMobile ? 22 : 26,
                      backgroundColor: "#000",
                      borderRadius: 14,
                    }}
                  />
                </div>
              </div>
            )}

            {activeModal.screenshots && activeModal.screenshots.length > 1 && (
              <p
                style={{
                  fontFamily: sans,
                  fontSize: "11px",
                  color: colors.faint,
                  margin: "0 0 20px",
                  textAlign: "center",
                }}
              >
                {isMobile ? "Swipe to see more" : "Scroll to see more"}
              </p>
            )}

            <p style={{ fontFamily: sans, fontSize: "0.925rem", lineHeight: 1.8, color: colors.muted, marginBottom: 20 }}>
              {activeModal.fullDesc}
            </p>

            <p style={{ fontFamily: mono, fontSize: "10px", letterSpacing: "0.06em", color: colors.faint, textTransform: "uppercase" }}>
              {activeModal.platform}
            </p>
          </div>
        </div>
      )}

      {/* ── Global styles ─────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        * { box-sizing: border-box; }
        a, button { -webkit-tap-highlight-color: transparent; }
        @media (max-width: 767px) {
          .project-card:active {
            border-color: #C8860A !important;
            transform: scale(0.98) !important;
          }
        }
        .ss-carousel::-webkit-scrollbar { height: 6px; }
        .ss-carousel::-webkit-scrollbar-thumb { background: #E0DCD4; border-radius: 3px; }
        .ss-carousel::-webkit-scrollbar-track { background: transparent; }
        .ss-carousel { scrollbar-width: thin; scrollbar-color: #E0DCD4 transparent; }
      `}</style>
    </div>
  );
};

// ─── Small shared components ──────────────────────────────────────────────────

const Divider = () => (
  <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
    <hr style={{ border: "none", borderTop: "1px solid #E0DCD4", margin: 0 }} />
  </div>
);

const StatusTag = ({ label, color, bg }: { label: string; color: string; bg: string }) => (
  <span
    style={{
      fontFamily: "'DM Mono', 'Menlo', monospace",
      fontSize: "9px",
      fontWeight: 500,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color,
      backgroundColor: bg,
      borderRadius: 4,
      padding: "3px 7px",
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </span>
);

export default Index;
