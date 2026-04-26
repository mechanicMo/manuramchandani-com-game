import { Link } from "react-router-dom";

const NotFound = () => (
  <div style={{
    height: "100%",
    overflowY: "auto",
    backgroundColor: "#06091A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}>
    <div style={{ textAlign: "center" }}>
      <p style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: "11px",
        color: "#C8860A",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        margin: "0 0 16px",
      }}>
        404
      </p>
      <h1 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: "clamp(2rem, 5vw, 3rem)",
        color: "#FAF8F4",
        margin: "0 0 16px",
        fontWeight: 700,
      }}>
        Off the map.
      </h1>
      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: "14px",
        color: "rgba(250,248,244,0.5)",
        margin: "0 0 32px",
      }}>
        That route doesn't exist on this mountain.
      </p>
      <Link to="/" style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: "12px",
        color: "#C8860A",
        textDecoration: "none",
        letterSpacing: "0.06em",
        border: "1px solid rgba(200,134,10,0.35)",
        borderRadius: "4px",
        padding: "8px 16px",
      }}>
        Back to the climb
      </Link>
    </div>
  </div>
);

export default NotFound;
