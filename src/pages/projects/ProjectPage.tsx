// src/pages/projects/ProjectPage.tsx
import { useParams, Link } from "react-router-dom";
import { projects } from "@/data/projects";
import { ArrowLeft } from "lucide-react";

const serif = "'Playfair Display', Georgia, serif";
const mono  = "'DM Mono', monospace";
const sans  = "'Inter', system-ui, sans-serif";

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 32 }}>
    <p style={{ fontFamily: mono, fontSize: "11px", color: "#C8860A", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
      {label}
    </p>
    {children}
  </div>
);

const ProjectPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const project = projects.find(p => p.slug === slug);

  if (!project) return (
    <div style={{ backgroundColor: "#FAF8F4", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#6B6B5E", marginBottom: 16 }}>Project not found.</p>
        <Link to="/" style={{ color: "#C8860A", textDecoration: "none" }}>Back to world</Link>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: "#FAF8F4", minHeight: "100vh", padding: "48px 24px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: sans, fontSize: "0.875rem", color: "#6B6B5E", textDecoration: "none", marginBottom: 48 }}>
          <ArrowLeft size={14} /> Back to world
        </Link>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontFamily: mono, fontSize: "11px", color: "#C8860A", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            {project.platform ?? project.type} · {project.tag}
          </p>
          <h1 style={{ fontFamily: serif, fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 700, marginBottom: 16, color: "#1A1A1A", lineHeight: 1.15 }}>
            {project.name}
          </h1>
          <p style={{ fontFamily: sans, fontSize: "1.125rem", lineHeight: 1.7, color: "#4A4A3E" }}>
            {project.fullDesc}
          </p>
        </div>

        {/* Stack */}
        {project.stack && project.stack.length > 0 && (
          <Section label="Stack">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {project.stack.map(tech => (
                <span key={tech} style={{
                  fontFamily: mono,
                  fontSize: "12px",
                  color: "#6B6B5E",
                  background: "rgba(200,134,10,0.08)",
                  border: "1px solid rgba(200,134,10,0.2)",
                  borderRadius: "4px",
                  padding: "4px 10px",
                }}>
                  {tech}
                </span>
              ))}
            </div>
          </Section>
        )}

        <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", margin: "32px 0" }} />

        {/* Problem */}
        {project.problem && (
          <Section label="The Problem">
            <p style={{ fontFamily: sans, fontSize: "1rem", lineHeight: 1.8, color: "#4A4A3E" }}>
              {project.problem}
            </p>
          </Section>
        )}

        {/* What shipped */}
        {project.whatShipped && (
          <Section label="What Shipped">
            <p style={{ fontFamily: sans, fontSize: "1rem", lineHeight: 1.8, color: "#4A4A3E" }}>
              {project.whatShipped}
            </p>
          </Section>
        )}

        {/* What was hard */}
        {project.whatWasHard && (
          <Section label="What Was Hard">
            <p style={{ fontFamily: sans, fontSize: "1rem", lineHeight: 1.8, color: "#4A4A3E" }}>
              {project.whatWasHard}
            </p>
          </Section>
        )}

        {/* Screenshots */}
        {project.screenshots && project.screenshots.length > 0 && (
          <Section label="Screens">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
              {project.screenshots.map((s, i) => (
                <div key={i}>
                  <img src={s.src} alt={s.caption} style={{ width: "100%", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)" }} />
                  <p style={{ fontFamily: sans, fontSize: "12px", color: "#9A9A8E", marginTop: 6 }}>{s.caption}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Live link */}
        {project.url && (
          <div style={{ marginTop: 40 }}>
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                fontFamily: sans,
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: "#FAF8F4",
                background: "#C8860A",
                padding: "12px 24px",
                borderRadius: "6px",
                textDecoration: "none",
              }}
            >
              View live
            </a>
          </div>
        )}

        <div style={{ marginTop: 64, paddingTop: 32, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
          <Link to="/" style={{ fontFamily: sans, fontSize: "0.875rem", color: "#6B6B5E", textDecoration: "none" }}>
            ← Back to world
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;
