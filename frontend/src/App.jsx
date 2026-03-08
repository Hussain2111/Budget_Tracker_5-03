import { useState, useEffect } from "react";
import "./App.css";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";

// App Shell
import Sidebar from "./components/Sidebar";
import { 
  Menu, 
  LayoutDashboard, 
  ArrowLeftRight, 
  PiggyBank, 
  Target, 
  BarChart2, 
  FileText 
} from "lucide-react";

// Inner pages (lazy-loaded via dynamic import pattern — just import all for now)
import Dashboard from "./components/Dashboard";
import Transactions from "./components/Transactions";
import Savings from "./components/Savings";
import Budget from "./components/Budget";
import Visualization from "./components/Visualization";
import Summary from "./components/MonthlyHistory";

// Page title map
const PAGE_TITLES = {
  dashboard:     "Dashboard",
  transactions:  "Transactions",
  savings:       "Savings",
  budget:        "Budget",
  visualization: "Visualize",
  summary:       "Summary",
};

// Bottom navigation items
const BOTTOM_NAV = [
  { key: "dashboard",     label: "Home",        icon: LayoutDashboard },
  { key: "transactions",  label: "Txns",        icon: ArrowLeftRight },
  { key: "savings",       label: "Savings",     icon: PiggyBank },
  { key: "budget",        label: "Budget",      icon: Target },
  { key: "visualization", label: "Charts",      icon: BarChart2 },
  { key: "summary",       label: "Summary",     icon: FileText },
];

function detectRoute() {
  const params = new URLSearchParams(window.location.search);
  const path = window.location.pathname;
  if (path === "/verify-email" || params.has("verify-email")) return "verify-email";
  if (path === "/reset-password" || params.has("reset-password")) return "reset-password";
  // Google OAuth callback: ?token=...
  if (params.get("token") && path === "/") return "oauth-callback";
  return null;
}

export default function App() {
  const [view, setView] = useState("landing"); // landing | login | register | forgot | reset | verify | app
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Handle special URL routes first
    const specialRoute = detectRoute();

    if (specialRoute === "oauth-callback") {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      localStorage.setItem("access_token", token);
      // Fetch profile
      import("./services/apiService").then(({ authService }) => {
        authService.getProfile()
          .then((res) => {
            const u = res.data;
            localStorage.setItem("user", JSON.stringify(u));
            setUser(u);
            setView("app");
            window.history.replaceState({}, "", "/");
          })
          .catch(() => setView("login"));
      });
      return;
    }

    if (specialRoute === "verify-email") {
      setView("verify-email");
      return;
    }

    if (specialRoute === "reset-password") {
      setView("reset");
      return;
    }

    // Check for existing session
    const token = localStorage.getItem("access_token");
    const stored = localStorage.getItem("user");
    if (token && stored) {
      try {
        setUser(JSON.parse(stored));
        setView("app");
      } catch {
        setView("landing");
      }
    }
  }, []);

  // Update document title
  useEffect(() => {
    if (view === "app") {
      document.title = `${PAGE_TITLES[currentPage] || "Dashboard"} · Fina`;
    } else {
      document.title = "Fina · Personal Finance Tracker";
    }
  }, [view, currentPage]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setView("app");
    window.history.replaceState({}, "", "/");
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
    setView("landing");
    window.history.replaceState({}, "", "/");
  };

  // ── Special routes ──
  if (view === "verify-email") {
    return (
      <VerifyEmail
        onVerified={() => {
          const stored = localStorage.getItem("user");
          if (stored) {
            setUser(JSON.parse(stored));
            setView("app");
          } else {
            setView("login");
          }
          window.history.replaceState({}, "", "/");
        }}
        onBack={() => {
          setView("login");
          window.history.replaceState({}, "", "/");
        }}
      />
    );
  }

  if (view === "reset") {
    return (
      <ResetPassword
        onSuccess={() => {
          setView("login");
          window.history.replaceState({}, "", "/");
        }}
        onBack={() => {
          setView("forgot");
          window.history.replaceState({}, "", "/");
        }}
      />
    );
  }

  // ── Landing / Auth ──
  if (view === "landing") {
    return (
      <Landing
        onGetStarted={() => setView("register")}
        onLogin={() => setView("login")}
      />
    );
  }

  if (view === "login") {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setView("register")}
        onForgotPassword={() => setView("forgot")}
      />
    );
  }

  if (view === "register") {
    return (
      <Register
        onRegisterSuccess={() => setView("login")}
        onSwitchToLogin={() => setView("login")}
      />
    );
  }

  if (view === "forgot") {
    return (
      <ForgotPassword onBack={() => setView("login")} />
    );
  }

  // ── App Shell ──
  if (view === "app") {
    const renderPage = () => {
      switch (currentPage) {
        case "dashboard":     return <Dashboard user={user} />;
        case "transactions":  return <Transactions />;
        case "savings":       return <Savings />;
        case "budget":        return <Budget />;
        case "visualization": return <Visualization />;
        case "summary":       return <Summary />;
        default:              return <Dashboard user={user} />;
      }
    };

    return (
      <div className="app-layout">
        {/* Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="sidebar-overlay" 
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          user={user}
          onLogout={handleLogout}
          className={sidebarOpen ? "open" : ""}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="main">
          <div className="topbar">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <span className="topbar-title">{PAGE_TITLES[currentPage]}</span>
            <div className="topbar-right">
              <div className="topbar-pill">
                <span style={{ fontSize: 11 }}>🌿</span>
                {user?.username}
              </div>
            </div>
          </div>
          <div className="page-content">
            {renderPage()}
          </div>
        </main>
        
        {/* Bottom Navigation */}
        <nav className="bottom-nav">
          {BOTTOM_NAV.map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              className={`bottom-nav-item ${currentPage === key ? "active" : ""}`}
              onClick={() => setCurrentPage(key)}
            >
              <Icon size={20} />
              <span>{label}</span>
            </div>
          ))}
        </nav>
      </div>
    );
  }

  return null;
}
