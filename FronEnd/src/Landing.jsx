import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

/* ── Scroll-reveal hook ── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ── Reusable animated wrapper ── */
function Reveal({ children, delay = 0, direction = "up", className = "" }) {
  const [ref, visible] = useReveal();
  const translate = { up: "translateY(40px)", down: "translateY(-40px)", left: "translateX(-40px)", right: "translateX(40px)" };
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translate(0)" : translate[direction],
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

/* ── Counter animation ── */
function AnimatedCounter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const [ref, visible] = useReveal();
  useEffect(() => {
    if (!visible) return;
    const isNum = !isNaN(parseInt(target));
    if (!isNum) { setCount(target); return; }
    const end = parseInt(target);
    let start = 0;
    const step = Math.ceil(end / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(start);
    }, 30);
    return () => clearInterval(timer);
  }, [visible, target]);
  return <span ref={ref}>{typeof count === "number" ? count : target}{suffix}</span>;
}

const SERVICES = [
  { icon: "🩺", title: "General Consultation", desc: "One-on-one medical consultation with our licensed physicians for any health concern." },
  { icon: "❤️", title: "Health Check-ups", desc: "Routine physical examinations and wellness assessments for all ages." },
  { icon: "💊", title: "Common Illness Treatment", desc: "Diagnosis and treatment of fever, cough, colds, flu, and other everyday ailments." },
  { icon: "🩸", title: "BP & Vital Monitoring", desc: "Regular monitoring of blood pressure, temperature, pulse rate, and oxygen levels." },
  { icon: "🩹", title: "Minor Wound Care", desc: "Proper cleaning, dressing, and management of minor cuts, wounds, and injuries." },
  { icon: "📄", title: "Medical Certificates", desc: "Issuance of medical certificates for school, work, or other official requirements." },
];

const REASONS = [
  { icon: "👨‍⚕️", title: "Experienced Staff", desc: "Licensed healthcare professionals dedicated to your well-being." },
  { icon: "🗂️", title: "Organized Records", desc: "Your medical history securely stored and always accessible." },
  { icon: "📅", title: "Easy Appointments", desc: "Book your visit online in minutes — no long queues, no hassle." },
  { icon: "🏠", title: "Clean Environment", desc: "A safe, comfortable, and hygienic clinic space for every patient." },
];

const SCHEDULE = [
  { day: "Monday",    hours: "8:00 AM – 5:00 PM",  open: true },
  { day: "Tuesday",   hours: "8:00 AM – 5:00 PM",  open: true },
  { day: "Wednesday", hours: "8:00 AM – 5:00 PM",  open: true },
  { day: "Thursday",  hours: "8:00 AM – 5:00 PM",  open: true },
  { day: "Friday",    hours: "8:00 AM – 5:00 PM",  open: true },
  { day: "Saturday",  hours: "8:00 AM – 12:00 PM", open: true },
  { day: "Sunday",    hours: "Closed",              open: false },
];

export default function ClinicSysLanding() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeDay, setActiveDay] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    // highlight today
    const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    setActiveDay(days[new Date().getDay()]);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (href) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const navLinks = [
    { label: "About",        href: "#about" },
    { label: "Services",     href: "#services" },
    { label: "Appointments", href: "#appointments" },
    { label: "Contact",      href: "#contact" },
  ];

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#F8FAFC", color: "#1E293B", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --primary:    #2563EB;
          --primary-dk: #1d4ed8;
          --secondary:  #DBEAFE;
          --bg:         #F8FAFC;
          --text:       #1E293B;
          --text-muted: #64748B;
          --accent:     #0D9488;
          --success:    #16A34A;
          --warning:    #F59E0B;
          --danger:     #DC2626;
          --white:      #ffffff;
        }

        .serif { font-family: 'Lora', serif; }

        /* NAV */
        .nav-glass {
          backdrop-filter: blur(16px);
          background: rgba(248,250,252,0.92);
          border-bottom: 1px solid rgba(37,99,235,0.10);
          box-shadow: 0 1px 16px rgba(37,99,235,0.06);
        }

        /* HERO */
        .hero-bg {
          background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 40%, #E0F2FE 70%, #F0FDF4 100%);
          position: relative;
        }
        .hero-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 70% 60% at 70% 40%, rgba(37,99,235,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        /* BUTTONS */
        .btn-primary {
          background: var(--primary);
          color: #fff;
          border: 2px solid var(--primary);
          padding: 12px 28px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.2s, transform 0.18s, box-shadow 0.18s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-primary:hover {
          background: var(--primary-dk);
          border-color: var(--primary-dk);
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(37,99,235,0.30);
        }

        .btn-outline {
          background: transparent;
          color: var(--primary);
          border: 2px solid var(--primary);
          padding: 12px 28px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, transform 0.18s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-outline:hover {
          background: var(--primary);
          color: #fff;
          transform: translateY(-3px);
        }

        .btn-white {
          background: #fff;
          color: var(--primary);
          border: 2px solid #fff;
          padding: 12px 28px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, transform 0.18s;
        }
        .btn-white:hover { background: var(--secondary); transform: translateY(-2px); }

        .btn-ghost-white {
          background: transparent;
          color: #fff;
          border: 2px solid rgba(255,255,255,0.6);
          padding: 12px 28px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.2s, transform 0.18s;
        }
        .btn-ghost-white:hover { background: rgba(255,255,255,0.12); transform: translateY(-2px); }

        /* CARDS */
        .service-card {
          background: #fff;
          border: 1.5px solid #E2E8F0;
          border-radius: 18px;
          padding: 24px;
          display: flex;
          gap: 16px;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .service-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 48px rgba(37,99,235,0.11);
          border-color: var(--primary);
        }

        .reason-card {
          background: rgba(255,255,255,0.06);
          border: 1.5px solid rgba(255,255,255,0.10);
          border-radius: 18px;
          padding: 28px 24px;
          transition: background 0.2s, transform 0.2s;
        }
        .reason-card:hover {
          background: rgba(255,255,255,0.12);
          transform: translateY(-4px);
        }

        .contact-card {
          background: #fff;
          border: 1.5px solid #E2E8F0;
          border-radius: 18px;
          padding: 28px 20px;
          text-align: center;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .contact-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(37,99,235,0.10);
        }

        /* CHIP */
        .chip {
          display: inline-block;
          background: var(--secondary);
          color: var(--primary);
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 99px;
          margin-bottom: 14px;
        }

        .chip-dark {
          display: inline-block;
          background: rgba(37,99,235,0.20);
          color: #93C5FD;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 99px;
          margin-bottom: 14px;
        }

        /* ACCENT LINE */
        .accent-line {
          width: 48px;
          height: 3px;
          background: linear-gradient(90deg, var(--primary), var(--accent));
          border-radius: 99px;
          margin: 12px auto 0;
        }

        /* PULSE */
        .pulse {
          animation: pulseRing 2.4s ease-out infinite;
        }
        @keyframes pulseRing {
          0%   { box-shadow: 0 0 0 0 rgba(37,99,235,0.45); }
          70%  { box-shadow: 0 0 0 14px rgba(37,99,235,0); }
          100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); }
        }

        /* HERO CARD FLOAT */
        .float-card {
          animation: floatY 4s ease-in-out infinite;
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }

        /* SCHEDULE TABLE */
        .sched-row { transition: background 0.15s; }
        .sched-row:hover { background: #EFF6FF; }

        /* TEAL ACCENT for accent elements */
        .teal-icon-bg { background: rgba(13,148,136,0.10); }
        .teal-text { color: var(--accent); }

        /* nav link */
        .nav-link {
          font-size: 0.875rem;
          font-weight: 500;
          color: #475569;
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.18s;
          padding: 0;
        }
        .nav-link:hover { color: var(--primary); }

        /* STEP CONNECTOR */
        .step-circle {
          width: 44px; height: 44px;
          border-radius: 50%;
          background: var(--primary);
          color: #fff;
          font-weight: 700;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(37,99,235,0.28);
        }

        /* STAT CARD */
        .stat-card-main {
          background: var(--primary);
          border-radius: 18px;
          padding: 28px 24px;
          color: #fff;
        }
        .stat-card {
          background: #fff;
          border: 1.5px solid #E2E8F0;
          border-radius: 18px;
          padding: 28px 24px;
        }

        /* SCROLLBAR */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #F8FAFC; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }

        @media (max-width: 768px) {
          .hero-card { display: none; }
        }
      `}</style>

      {/* ════════════════ NAVBAR ════════════════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        transition: "all 0.3s"
      }} className={scrolled ? "nav-glass" : ""}>
        <div style={{ maxWidth: 1152, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(37,99,235,0.30)"
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 3v14M3 10h14" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text)", lineHeight: 1.1 }}>ClinicSys</div>
              <div style={{ fontSize: "0.65rem", color: "var(--primary)", fontWeight: 700, letterSpacing: "0.08em" }}>GENERAL CLINIC</div>
            </div>
          </Link>

          {/* Desktop links */}
          <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="hidden-mobile">
            {navLinks.map(({ label, href }) => (
              <button key={label} onClick={() => scrollTo(href)} className="nav-link">{label}</button>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div style={{ display: "flex", gap: 10 }} className="hidden-mobile">
            <Link to="/login"><button className="btn-outline" style={{ padding: "9px 20px", fontSize: "0.82rem" }}>🔐 Patient Login</button></Link>
            <Link to="/login"><button className="btn-primary" style={{ padding: "9px 20px", fontSize: "0.82rem" }}>📅 Book Now</button></Link>
          </div>

          {/* Mobile burger */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: 8, flexDirection: "column", gap: 5 }}
            className="show-mobile">
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 22, height: 2, background: "var(--text)", borderRadius: 2,
                transition: "all 0.2s",
                transform: menuOpen && i === 0 ? "rotate(45deg) translate(5px,5px)" : menuOpen && i === 2 ? "rotate(-45deg) translate(5px,-5px)" : "none",
                opacity: menuOpen && i === 1 ? 0 : 1
              }}/>
            ))}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ background: "#fff", borderTop: "1px solid #E2E8F0", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
            {navLinks.map(({ label, href }) => (
              <button key={label} onClick={() => scrollTo(href)} className="nav-link" style={{ textAlign: "left", fontSize: "0.95rem" }}>{label}</button>
            ))}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8, borderTop: "1px solid #F1F5F9" }}>
              <Link to="/login" onClick={() => setMenuOpen(false)}><button className="btn-outline" style={{ width: "100%", justifyContent: "center" }}>🔐 Patient Login</button></Link>
              <Link to="/login" onClick={() => setMenuOpen(false)}><button className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>📅 Book Appointment</button></Link>
            </div>
          </div>
        )}
      </nav>

      <style>{`
        .hidden-mobile { display: flex !important; }
        .show-mobile   { display: none !important; }
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile   { display: flex !important; }
        }
      `}</style>

      {/* ════════════════ HERO ════════════════ */}
      <section className="hero-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", paddingTop: 88, paddingBottom: 64, padding: "88px 24px 64px" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}
          className="hero-grid">
          <style>{`.hero-grid { grid-template-columns: 1fr 1fr; } @media(max-width:768px){ .hero-grid { grid-template-columns: 1fr; } }`}</style>

          {/* Left */}
          <Reveal direction="left">
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.85)", border: "1.5px solid rgba(37,99,235,0.20)", borderRadius: 99, padding: "6px 16px", marginBottom: 24, boxShadow: "0 2px 12px rgba(37,99,235,0.08)" }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--success)" }} className="pulse"/>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--success)" }}>Now Accepting Patients</span>
            </div>

            <h1 className="serif" style={{ fontSize: "clamp(2.2rem, 5vw, 3.6rem)", lineHeight: 1.15, color: "var(--text)", marginBottom: 12 }}>
              Welcome to<br/>
              <span style={{ color: "var(--primary)" }}>ClinicSys</span>
            </h1>
            <p className="serif" style={{ fontSize: "1.15rem", color: "var(--accent)", fontStyle: "italic", marginBottom: 20 }}>
              "Your Trusted Partner in Health and Wellness"
            </p>
            <p style={{ color: "#475569", fontSize: "1rem", lineHeight: 1.75, marginBottom: 36, maxWidth: 480 }}>
              We are a <strong>General Clinic</strong> committed to providing safe, affordable, and quality primary healthcare to every patient — because your health is our priority.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
              <Link to="/login"><button className="btn-primary">📅 Book Appointment</button></Link>
              <Link to="/login"><button className="btn-outline">🔐 Patient Login</button></Link>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#94A3B8", fontSize: "0.82rem" }}>
              <span>🕒</span>
              <span>Mon – Fri &nbsp;8:00 AM – 5:00 PM &nbsp;·&nbsp; Sat 8:00 AM – 12:00 PM</span>
            </div>
          </Reveal>

          {/* Right: floating appointment card */}
          <Reveal direction="right" delay={150}>
            <div className="float-card hero-card" style={{ position: "relative" }}>
              {/* shadow card */}
              <div style={{ position: "absolute", top: 10, left: 10, right: -6, bottom: -10, background: "var(--secondary)", borderRadius: 24, opacity: 0.6 }}></div>

              {/* main card */}
              <div style={{ position: "relative", background: "#fff", borderRadius: 24, boxShadow: "0 24px 64px rgba(37,99,235,0.14)", padding: 24, border: "1.5px solid #E2E8F0" }}>
                {/* header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 16, borderBottom: "1px solid #F1F5F9", marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏥</div>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--text)" }}>ClinicSys</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--primary)", fontWeight: 600 }}>General Clinic · Today</div>
                  </div>
                  <span style={{ marginLeft: "auto", background: "#DCFCE7", color: "var(--success)", fontSize: "0.65rem", fontWeight: 700, padding: "3px 10px", borderRadius: 99 }}>OPEN</span>
                </div>

                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Today's Appointments</div>

                {[
                  { time: "9:00 AM",  name: "Maria Santos",  type: "Consultation",  status: "Ongoing",   sc: "#DBEAFE", tc: "#1d4ed8" },
                  { time: "10:30 AM", name: "Juan dela Cruz", type: "Check-up",      status: "Scheduled", sc: "#FEF9C3", tc: "#92400e" },
                  { time: "12:00 PM", name: "Ana Reyes",      type: "Wound Care",   status: "Scheduled", sc: "#FEF9C3", tc: "#92400e" },
                  { time: "2:00 PM",  name: "Carlos Gomez",   type: "BP Monitoring", status: "Completed", sc: "#DCFCE7", tc: "#15803d" },
                ].map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < 3 ? "1px solid #F8FAFC" : "none" }}>
                    <div style={{ fontSize: "0.72rem", color: "#94A3B8", width: 58, flexShrink: 0 }}>{a.time}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text)" }}>{a.name}</div>
                      <div style={{ fontSize: "0.68rem", color: "#94A3B8" }}>{a.type}</div>
                    </div>
                    <span style={{ background: a.sc, color: a.tc, fontSize: "0.62rem", fontWeight: 700, padding: "3px 8px", borderRadius: 99 }}>{a.status}</span>
                  </div>
                ))}

                <Link to="/login" style={{ display: "block", marginTop: 16 }}>
                  <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>+ Book Your Slot</button>
                </Link>
              </div>

              {/* floating badge top */}
              <div style={{ position: "absolute", top: -14, right: 16, background: "var(--primary)", color: "#fff", fontSize: "0.72rem", fontWeight: 700, padding: "6px 14px", borderRadius: 99, boxShadow: "0 4px 16px rgba(37,99,235,0.35)" }}>
                4 Appointments Today
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════ ABOUT ════════════════ */}
      <section id="about" style={{ padding: "96px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}
          className="two-col">
          <style>{`.two-col { grid-template-columns: 1fr 1fr; } @media(max-width:768px){ .two-col { grid-template-columns: 1fr; } }`}</style>

          {/* Stats grid */}
          <Reveal direction="left">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { val: "500", suffix: "+", label: "Patients Served", main: true },
                { val: "6",   suffix: "",  label: "Services Offered" },
                { val: "Mon–Sat", suffix: "", label: "Open Days" },
                { val: "8AM–5PM", suffix: "", label: "Clinic Hours" },
              ].map((s, i) => (
                <div key={i} className={s.main ? "stat-card-main" : "stat-card"}>
                  <div className="serif" style={{ fontSize: "2.2rem", fontWeight: 600, color: s.main ? "#fff" : "var(--primary)", marginBottom: 4 }}>
                    {s.suffix ? <><AnimatedCounter target={s.val} />{s.suffix}</> : s.val}
                  </div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 500, color: s.main ? "#BFDBFE" : "#64748B" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Text */}
          <Reveal direction="right" delay={100}>
            <span className="chip">About Us</span>
            <h2 className="serif" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", color: "var(--text)", marginBottom: 20, lineHeight: 1.25 }}>
              Quality Healthcare,<br/>Close to Home
            </h2>
            <p style={{ color: "#475569", lineHeight: 1.8, marginBottom: 16 }}>
              ClinicSys is a <strong>General Clinic</strong> dedicated to providing comprehensive primary healthcare services to individuals and families in our community. We believe quality healthcare should be accessible to everyone.
            </p>
            <p style={{ color: "#475569", lineHeight: 1.8, marginBottom: 28 }}>
              Our clinic is staffed with experienced healthcare professionals committed to delivering safe, affordable, and compassionate care in a clean and welcoming environment.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: 14, padding: "14px 18px" }}>
              <span style={{ fontSize: "1.8rem" }}>🏅</span>
              <div>
                <div style={{ fontWeight: 700, color: "var(--text)", fontSize: "0.9rem" }}>Licensed & Accredited</div>
                <div style={{ fontSize: "0.78rem", color: "#64748B" }}>Compliant with Philippine healthcare standards</div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════ SERVICES ════════════════ */}
      <section id="services" style={{ padding: "96px 24px", background: "var(--bg)" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <span className="chip">Our Services</span>
              <h2 className="serif" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", color: "var(--text)" }}>What We Offer</h2>
              <div className="accent-line"></div>
              <p style={{ color: "#64748B", marginTop: 16, maxWidth: 500, margin: "16px auto 0", fontSize: "0.92rem" }}>
                From routine check-ups to common illness treatment — primary care services you and your family need.
              </p>
            </div>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }} className="services-grid">
            <style>{`.services-grid { grid-template-columns: repeat(3,1fr); } @media(max-width:900px){ .services-grid { grid-template-columns: repeat(2,1fr); } } @media(max-width:560px){ .services-grid { grid-template-columns: 1fr; } }`}</style>
            {SERVICES.map((s, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="service-card">
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", flexShrink: 0 }}>{s.icon}</div>
                  <div>
                    <h3 style={{ fontWeight: 700, color: "var(--text)", marginBottom: 6, fontSize: "0.95rem" }}>{s.title}</h3>
                    <p style={{ color: "#64748B", fontSize: "0.83rem", lineHeight: 1.65 }}>{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ APPOINTMENTS ════════════════ */}
      <section id="appointments" style={{ padding: "96px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }}
          className="two-col">

          {/* Steps */}
          <Reveal direction="left">
            <span className="chip">Book Online</span>
            <h2 className="serif" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)", color: "var(--text)", marginBottom: 12, lineHeight: 1.25 }}>
              Easy Appointment Booking
            </h2>
            <p style={{ color: "#475569", lineHeight: 1.8, marginBottom: 36, fontSize: "0.92rem" }}>
              No more long waiting lines. Book your appointment online in just a few clicks, pick your preferred date and time, and we'll take care of the rest.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {[
                { step: "1", title: "Log In or Register",       desc: "Create a patient account or log in if you already have one.", icon: "🔐" },
                { step: "2", title: "Choose Date & Time",       desc: "Pick a schedule that works best for you from available slots.", icon: "📅" },
                { step: "3", title: "Fill in Your Details",     desc: "Provide your reason for visit and any relevant information.", icon: "📝" },
                { step: "4", title: "Receive Confirmation",     desc: "Get a booking confirmation and see you at the clinic!", icon: "✅" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div className="step-circle">{s.step}</div>
                  <div style={{ paddingTop: 6 }}>
                    <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 4, fontSize: "0.95rem" }}>{s.icon} {s.title}</div>
                    <div style={{ color: "#64748B", fontSize: "0.83rem", lineHeight: 1.65 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/login" style={{ display: "inline-block", marginTop: 32 }}>
              <button className="btn-primary">📅 Book Appointment Now</button>
            </Link>
          </Reveal>

          {/* Schedule */}
          <Reveal direction="right" delay={120}>
            <div style={{ borderRadius: 20, overflow: "hidden", border: "1.5px solid #E2E8F0", boxShadow: "0 8px 32px rgba(37,99,235,0.08)" }}>
              <div style={{ background: "var(--primary)", padding: "20px 24px" }}>
                <h3 style={{ fontWeight: 700, color: "#fff", fontSize: "1.05rem", marginBottom: 4 }}>🕒 Clinic Schedule</h3>
                <p style={{ color: "#BFDBFE", fontSize: "0.78rem" }}>Walk-ins welcome during open hours</p>
              </div>
              <div>
                {SCHEDULE.map((row, i) => (
                  <div key={i} className="sched-row" style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "13px 24px",
                    borderBottom: i < 6 ? "1px solid #F1F5F9" : "none",
                    background: row.day === activeDay ? "#EFF6FF" : i % 2 === 0 ? "#fff" : "#FAFBFC"
                  }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: row.day === activeDay ? 700 : 500, color: row.day === activeDay ? "var(--primary)" : "var(--text)" }}>
                      {row.day} {row.day === activeDay && <span style={{ fontSize: "0.65rem", background: "var(--primary)", color: "#fff", padding: "2px 8px", borderRadius: 99, marginLeft: 6, verticalAlign: "middle" }}>TODAY</span>}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: "0.83rem", color: row.open ? "#475569" : "var(--danger)" }}>{row.hours}</span>
                      <span style={{
                        fontSize: "0.60rem", fontWeight: 700, padding: "3px 8px", borderRadius: 99,
                        background: row.open ? "#DCFCE7" : "#FEE2E2",
                        color: row.open ? "var(--success)" : "var(--danger)"
                      }}>{row.open ? "OPEN" : "CLOSED"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════ WHY CHOOSE US ════════════════ */}
      <section style={{ padding: "96px 24px", background: "#1E293B", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }}></div>
        <div style={{ maxWidth: 1152, margin: "0 auto", position: "relative" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <span className="chip-dark">Why Choose Us</span>
              <h2 className="serif" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", color: "#fff" }}>The ClinicSys Difference</h2>
              <p style={{ color: "#94A3B8", marginTop: 14, maxWidth: 460, margin: "14px auto 0", fontSize: "0.92rem" }}>
                We go beyond treatment — we build a relationship of trust and care with every patient.
              </p>
            </div>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }} className="four-col">
            <style>{`.four-col { grid-template-columns: repeat(4,1fr); } @media(max-width:900px){ .four-col { grid-template-columns: repeat(2,1fr); } } @media(max-width:480px){ .four-col { grid-template-columns: 1fr; } }`}</style>
            {REASONS.map((r, i) => (
              <Reveal key={i} delay={i * 90}>
                <div className="reason-card" style={{ height: "100%" }}>
                  <div style={{ fontSize: "2rem", marginBottom: 16 }}>{r.icon}</div>
                  <h3 style={{ fontWeight: 700, color: "#fff", marginBottom: 10, fontSize: "1rem" }}>{r.title}</h3>
                  <p style={{ color: "#94A3B8", fontSize: "0.83rem", lineHeight: 1.65 }}>{r.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ CONTACT ════════════════ */}
      <section id="contact" style={{ padding: "96px 24px", background: "var(--bg)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <span className="chip">Get In Touch</span>
              <h2 className="serif" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", color: "var(--text)" }}>Contact & Location</h2>
              <div className="accent-line"></div>
            </div>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 40 }} className="four-col">
            {[
              { icon: "📍", label: "Address",      value: "123 Rizal Avenue,\nQuezon City, Metro Manila" },
              { icon: "📞", label: "Phone",        value: "(02) 8-000-0000\n+63 912 345 6789" },
              { icon: "📧", label: "Email",        value: "support@clinicsys.ph\nappointments@clinicsys.ph" },
              { icon: "🕒", label: "Clinic Hours", value: "Mon–Fri: 8AM–5PM\nSaturday: 8AM–12PM" },
            ].map((c, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="contact-card">
                  <div style={{ fontSize: "2rem", marginBottom: 12 }}>{c.icon}</div>
                  <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--primary)", marginBottom: 8 }}>{c.label}</div>
                  <div style={{ fontSize: "0.83rem", color: "#475569", lineHeight: 1.7, whiteSpace: "pre-line" }}>{c.value}</div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* CTA strip */}
          <Reveal>
            <div style={{ background: "var(--primary)", borderRadius: 20, padding: "48px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, opacity: 0.08, backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "22px 22px", pointerEvents: "none" }}></div>
              <div style={{ position: "relative" }}>
                <h3 className="serif" style={{ fontSize: "1.7rem", color: "#fff", marginBottom: 10 }}>Ready to Schedule Your Visit?</h3>
                <p style={{ color: "#BFDBFE", marginBottom: 28, fontSize: "0.92rem" }}>Book online now or drop by during clinic hours — we're here for you.</p>
                <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                  <Link to="/login"><button className="btn-white">📅 Book Appointment</button></Link>
                  <Link to="/login"><button className="btn-ghost-white">🔐 Patient Login</button></Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer style={{ background: "#0F172A", color: "#fff", padding: "64px 24px 32px" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 40, marginBottom: 48 }} className="four-col">
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M10 3v14M3 10h14" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>ClinicSys</div>
                <div style={{ fontSize: "0.62rem", color: "#60A5FA", fontWeight: 700, letterSpacing: "0.08em" }}>GENERAL CLINIC</div>
              </div>
            </div>
            <p style={{ color: "#64748B", fontSize: "0.82rem", lineHeight: 1.7 }}>
              Your trusted partner in health and wellness. Safe, affordable, and quality primary care.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#334155", marginBottom: 16 }}>Quick Links</div>
            {[{ label: "About Us", href: "#about" }, { label: "Services", href: "#services" }, { label: "Appointments", href: "#appointments" }, { label: "Contact", href: "#contact" }]
              .map(({ label, href }) => (
                <button key={label} onClick={() => scrollTo(href)} style={{ display: "block", fontSize: "0.83rem", color: "#64748B", marginBottom: 10, background: "none", border: "none", cursor: "pointer", textAlign: "left", transition: "color 0.15s", padding: 0 }}
                  onMouseEnter={e => e.target.style.color = "#fff"} onMouseLeave={e => e.target.style.color = "#64748B"}>
                  {label}
                </button>
              ))}
          </div>

          {/* Services */}
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#334155", marginBottom: 16 }}>Services</div>
            {["General Consultation", "Health Check-ups", "Common Illness Treatment", "BP & Vital Monitoring", "Minor Wound Care", "Medical Certificates"].map(s => (
              <div key={s} style={{ fontSize: "0.83rem", color: "#64748B", marginBottom: 8 }}>{s}</div>
            ))}
          </div>

          {/* Contact */}
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#334155", marginBottom: 16 }}>Contact</div>
            {[
              "📍 123 Rizal Ave., Quezon City",
              "📞 (02) 8-000-0000",
              "📧 support@clinicsys.ph",
              "🕒 Mon–Sat, 8AM–5PM"
            ].map(c => (
              <div key={c} style={{ fontSize: "0.83rem", color: "#64748B", marginBottom: 10 }}>{c}</div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: "1px solid #1E293B", paddingTop: 24, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, fontSize: "0.78rem", color: "#334155" }}>
          <div>© 2026 ClinicSys General Clinic. All rights reserved.</div>
          <div style={{ display: "flex", gap: 24 }}>
            {["Privacy Policy", "Terms & Conditions"].map(l => (
              <a key={l} href="#" style={{ color: "#334155", textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={e => e.target.style.color = "#fff"} onMouseLeave={e => e.target.style.color = "#334155"}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}