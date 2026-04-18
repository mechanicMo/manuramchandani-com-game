// src/pages/projects/ProjectPage.tsx
import { useParams, Link } from "react-router-dom";
import { projects } from "@/data/projects";
import { ArrowLeft } from "lucide-react";

const serif = "'Playfair Display', Georgia, serif";
const sans  = "'Inter', system-ui, sans-serif";

const ProjectPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const project = projects.find(p => p.slug === slug);

  if (!project) return (
    <div style={{ backgroundColor: "#FAF8F4", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#6B6B5E", marginBottom: 16 }}>Project not found.</p>
        <Link to="/" style={{ color: "#C8860A", textDecoration: "none" }}>← Back</Link>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: "#FAF8F4", minHeight: "100vh", padding: "48px 24px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: sans, fontSize: "0.875rem", color: "#6B6B5E", textDecoration: "none", marginBottom: 48 }}>
          <ArrowLeft size={14} /> Back to world
        </Link>
        <h1 style={{ fontFamily: serif, fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 700, marginBottom: 8, color: "#1A1A1A" }}>{project.name}</h1>
        <p style={{ fontFamily: sans, fontSize: "0.875rem", color: "#6B6B5E", marginBottom: 40 }}>{project.platform ?? project.type} · {project.tag}</p>
        <p style={{ fontFamily: sans, fontSize: "1rem", lineHeight: 1.8, color: "#6B6B5E" }}>{project.fullDesc}</p>
        <p style={{ fontFamily: sans, fontSize: "0.875rem", color: "#9A9A8E", marginTop: 48, fontStyle: "italic" }}>Full case study — Plan G3.</p>
      </div>
    </div>
  );
};

export default ProjectPage;
