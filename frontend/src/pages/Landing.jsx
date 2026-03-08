import { useEffect, useRef } from "react";
import "./Landing.css";

const FinaLogo = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M11 2C6.03 2 2 6.03 2 11s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z" fill="rgba(255,255,255,0.15)"/>
    <path d="M8 15V9.5L11 7l3 2.5V15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.5 15v-3h3v3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 11.5h8" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeLinecap="round"/>
  </svg>
);

const FEATURES = [
  {
    icon: "📊",
    title: "Smart Dashboard",
    desc: "Your complete financial picture at a glance. Monthly trends, budget pace, and AI-driven insights — all in one view.",
  },
  {
    icon: "🔁",
    title: "Recurring Transactions",
    desc: "Set rent, subscriptions, and salary once. Fina auto-logs them every month so nothing slips through.",
  },
  {
    icon: "🎯",
    title: "Budget Tracking",
    desc: "Set category limits and watch your progress in real time. Alerts before you overspend, not after.",
  },
  {
    icon: "📥",
    title: "CSV Bank Import",
    desc: "Paste in your bank statement and Fina maps the columns automatically. Months of history in seconds.",
  },
  {
    icon: "🏦",
    title: "Savings Goals",
    desc: "Track every goal from emergency fund to dream holiday. See monthly contributions needed and never miss a target.",
  },
  {
    icon: "📈",
    title: "Visual Reports",
    desc: "Pie charts, trend lines, and monthly summaries that actually tell you something useful about your money.",
  },
];

const STATS = [
  { value: "100%", label: "Free to use" },
  { value: "< 2min", label: "Setup time" },
  { value: "6+", label: "Tracking views" },
  { value: "0", label: "Hidden fees" },
];

export default function Landing({ onGetStarted, onLogin }) {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);

  useEffect(() => {
    // Staggered hero animation on mount
    const els = heroRef.current?.querySelectorAll("[data-animate]");
    els?.forEach((el, i) => {
      el.style.animationDelay = `${i * 0.12}s`;
      el.classList.add("animate-in");
    });

    // Intersection observer for features
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15 },
    );

    const cards = featuresRef.current?.querySelectorAll(".feature-card");
    cards?.forEach((c) => observer.observe(c));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing">
      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <div className="landing-logo-mark">
              <FinaLogo />
            </div>
            <span className="landing-logo-name">Fina</span>
          </div>
          <div className="landing-nav-actions">
            <button className="landing-btn-ghost" onClick={onLogin}>
              Log in
            </button>
            <button className="landing-btn-primary" onClick={onGetStarted}>
              Get started free
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero" ref={heroRef}>
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-grid" />
        </div>

        <div className="hero-inner">
          <div className="hero-pill" data-animate>
            <span className="hero-pill-dot" />
            Your personal finance tracker
          </div>

          <h1 className="hero-headline" data-animate>
            Take control of<br />
            <span className="hero-headline-accent">your money.</span>
          </h1>

          <p className="hero-subline" data-animate>
            Fina gives you a clear picture of where your money goes — with
            smart budgets, savings goals, and insights that actually make sense.
          </p>

          <div className="hero-actions" data-animate>
            <button className="hero-cta-primary" onClick={onGetStarted}>
              Get started — it's free
              <span className="hero-cta-arrow">→</span>
            </button>
            <button className="hero-cta-ghost" onClick={onLogin}>
              I already have an account
            </button>
          </div>

          <div className="hero-stats" data-animate>
            {STATS.map((s) => (
              <div className="hero-stat" key={s.label}>
                <div className="hero-stat-value">{s.value}</div>
                <div className="hero-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard preview mockup */}
        <div className="hero-mockup" data-animate>
          <div className="mockup-window">
            <div className="mockup-bar">
              <span className="mockup-dot" style={{ background: "#ff5f57" }} />
              <span className="mockup-dot" style={{ background: "#febc2e" }} />
              <span className="mockup-dot" style={{ background: "#28c840" }} />
              <span className="mockup-url">fina.app · dashboard</span>
            </div>
            <div className="mockup-body">
              {/* Mini dashboard */}
              <div className="mock-metrics">
                {[
                  { label: "Income", value: "$6,000", color: "#1a8a4a" },
                  { label: "Expenses", value: "$2,340", color: "#c0392b" },
                  { label: "Savings", value: "$3,660", color: "#1a4731" },
                ].map((m) => (
                  <div className="mock-metric" key={m.label}>
                    <div className="mock-metric-label">{m.label}</div>
                    <div className="mock-metric-value" style={{ color: m.color }}>
                      {m.value}
                    </div>
                    <div className="mock-metric-bar">
                      <div
                        className="mock-metric-fill"
                        style={{
                          width: m.label === "Income" ? "100%" : m.label === "Expenses" ? "39%" : "61%",
                          background: m.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mock-chart">
                <div className="mock-chart-label">6-month trend</div>
                <svg viewBox="0 0 280 70" className="mock-svg">
                  <polyline
                    points="0,55 50,45 90,50 130,35 180,25 230,15 280,8"
                    fill="none"
                    stroke="#1a4731"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <polyline
                    points="0,35 50,42 90,38 130,45 180,32 230,28 280,22"
                    fill="none"
                    stroke="#c0392b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="4 2"
                  />
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1a4731" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#1a4731" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points="0,55 50,45 90,50 130,35 180,25 230,15 280,8 280,70 0,70"
                    fill="url(#g1)"
                  />
                </svg>
              </div>
              <div className="mock-txs">
                {[
                  { icon: "🛒", name: "Whole Foods", amt: "-$84", color: "#c0392b" },
                  { icon: "💼", name: "Salary", amt: "+$4,800", color: "#1a8a4a" },
                  { icon: "⚡", name: "Electric Bill", amt: "-$98", color: "#c0392b" },
                ].map((tx) => (
                  <div className="mock-tx" key={tx.name}>
                    <span className="mock-tx-icon">{tx.icon}</span>
                    <span className="mock-tx-name">{tx.name}</span>
                    <span className="mock-tx-amt" style={{ color: tx.color }}>{tx.amt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features" ref={featuresRef}>
        <div className="features-inner">
          <div className="section-eyebrow">Everything you need</div>
          <h2 className="section-headline">
            Built for people who want to<br />
            actually understand their finances
          </h2>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div
                className="feature-card"
                key={f.title}
                style={{ transitionDelay: `${(i % 3) * 0.08}s` }}
              >
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-inner">
          <div className="cta-orb" />
          <h2 className="cta-headline">
            Start tracking today.<br />It takes two minutes.
          </h2>
          <p className="cta-sub">
            No credit card. No setup fees. Just a clearer picture of your finances.
          </p>
          <button className="hero-cta-primary" onClick={onGetStarted}>
            Create your free account
            <span className="hero-cta-arrow">→</span>
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-brand" style={{ justifyContent: "center" }}>
          <div className="landing-logo-mark" style={{ width: 22, height: 22 }}>
            <FinaLogo />
          </div>
          <span className="landing-logo-name" style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
            Fina
          </span>
        </div>
        <div className="footer-copy">
          © {new Date().getFullYear()} Fina · Personal Finance Tracker
        </div>
      </footer>
    </div>
  );
}
