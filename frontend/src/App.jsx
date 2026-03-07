import { useState, useEffect } from "react";
import { Spin, message } from "antd";
import {
  DashboardOutlined,
  SwapOutlined,
  WalletOutlined,
  BankOutlined,
  BarChartOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  DownOutlined,
} from "@ant-design/icons";
import Transactions from "./components/Transactions";
import Savings from "./components/Savings";
import Budget from "./components/Budget";
import Visualization from "./components/Visualization";
import MonthlyHistory from "./components/MonthlyHistory";
import Dashboard from "./components/Dashboard.jsx";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { authService } from "./services/apiService";
import "./App.css";

const NAVIGATION_ITEMS = [
  { key: "dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
  { key: "transactions", icon: <SwapOutlined />, label: "Transactions" },
  { key: "budget", icon: <WalletOutlined />, label: "Budget" },
  { key: "savings", icon: <BankOutlined />, label: "Savings" },
  { key: "visualization", icon: <BarChartOutlined />, label: "Visualization" },
  { key: "summary", icon: <HistoryOutlined />, label: "Summary" },
];

const getComponent = (key, onNavigate) => {
  switch (key) {
    case "dashboard":
      return <Dashboard onNavigate={onNavigate} />;
    case "transactions":
      return <Transactions />;
    case "savings":
      return <Savings />;
    case "budget":
      return <Budget />;
    case "visualization":
      return <Visualization />;
    case "summary":
      return <MonthlyHistory onNavigate={onNavigate} />;
    default:
      return <Dashboard onNavigate={onNavigate} />;
  }
};
function App() {
  const ACTIVE_PAGE = "active_page";
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState("login");
  const [activePage, setActivePage] = useState(() => {
    const activePage = localStorage.getItem("ACTIVE_PAGE");
    return activePage && ["dashboard", "transactions", "budget", "savings", "visualization", "summary"].includes(activePage) ? activePage : "dashboard";
  });
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    localStorage.removeItem("ACTIVE_PAGE");
    setIsAuthenticated(false);
    setUser(null);
    setCurrentPage("login");
    setActivePage("dashboard");
  };

  useEffect(() => {
    if (isAuthenticated && activePage && ["dashboard", "transactions", "budget", "savings", "visualization", "summary"].includes(activePage)) {
      localStorage.setItem(ACTIVE_PAGE, activePage);
    }
  }, [activePage, isAuthenticated]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const tokenFromUrl = url.searchParams.get("token");
    if (tokenFromUrl) {
      localStorage.setItem("access_token", tokenFromUrl);

      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.toString());
    }

    const boot = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setAuthChecked(true);
        setIsAuthenticated(false);
        setUser(null);
        setCurrentPage("login");
        return;
      }

      try {
        const res = await authService.profile();
        setUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
        setIsAuthenticated(true);
        setCurrentPage("app");

        const activePage = localStorage.getItem("ACTIVE_PAGE");
        if (activePage && ["dashboard", "transactions", "budget", "savings", "visualization", "summary"].includes(activePage)) {
          setActivePage(activePage);
        }
      } catch (e) {
        handleLogout();
      } finally {
        setAuthChecked(true);
      }
    };

    boot();

  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setCurrentPage("app");

    const activePage = localStorage.getItem("ACTIVE_PAGE");
    if (activePage && ["dashboard", "transactions", "budget", "savings", "visualization", "summary"].includes(activePage)) {
      setActivePage(activePage);
    }
    else {
      setActivePage("dashboard");
    }
  };

  const handleRegisterSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setCurrentPage("app");

    const activePage = localStorage.getItem("ACTIVE_PAGE");
    if (activePage && ["dashboard", "transactions", "budget", "savings", "visualization", "summary"].includes(activePage)) {
      setActivePage(activePage);
    }
    else {
      setActivePage("dashboard");
    }
  };

  if (!authChecked) {
    return (
        <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
          <Spin size="large" />
        </div>
    );
  }

  if (!isAuthenticated) {
    if (currentPage === "login") {
      return (
          <Login
              onLoginSuccess={handleLoginSuccess}
              onSwitchToRegister={() => setCurrentPage("register")}
          />
      );
    }
    return (
        <Register
            onRegisterSuccess={handleRegisterSuccess}
            onSwitchToLogin={() => setCurrentPage("login")}
        />
    );
  }

  // Navigation handler for components
  const handleNavigate = (page) => {
    setActivePage(page);
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"/>
            </svg>
          </div>
          <span className="logo-name">Budget Tracker</span>
        </div>
        <nav className="sidebar-nav">
          {NAVIGATION_ITEMS.map((item) => (
            <div
              key={item.key}
              className={`nav-item ${activePage === item.key ? "active" : ""}`}
              onClick={() => setActivePage(item.key)}
            >
              {item.icon}
              {item.label}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="avatar">
            {user?.username ? user.username.substring(0, 2).toUpperCase() : "JS"}
          </div>
          <div style={{ flex: 1 }}>
            <div className="sidebar-user-name">{user?.username || "Jamie S."}</div>
            <div className="sidebar-user-plan">Personal</div>
          </div>
          <div
              onClick={handleLogout}
              title="Log out"
              style={{
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.35)",
                  fontSize: 16,
                  flexShrink: 0,
                  transition: "color 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.8)"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}
          >
              ⎋
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main">

        <div className="page-content">
          {getComponent(activePage, handleNavigate)}
        </div>
      </div>
    </div>
  );
}

export default App;