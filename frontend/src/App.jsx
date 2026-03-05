import { useState, useEffect } from "react";
import {
  Layout,
  Menu,
  Dropdown,
  Avatar,
  Spin,
  Typography,
  Button,
} from "antd";
import {
  LogoutOutlined,
  UserOutlined,
  DashboardOutlined,
  SwapOutlined,
  BankOutlined,
  WalletOutlined,
  BarChartOutlined,
  HistoryOutlined,
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

const { Text } = Typography;
const { Sider, Content, Footer } = Layout;

const NAVIGATION_ITEMS = [
  { key: "dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
  { key: "transactions", icon: <SwapOutlined />, label: "Transactions" },
  { key: "savings", icon: <BankOutlined />, label: "Savings" },
  { key: "budget", icon: <WalletOutlined />, label: "Budget" },
  { key: "visualization", icon: <BarChartOutlined />, label: "Visualization" },
  { key: "summary", icon: <HistoryOutlined />, label: "Summary" },
];

const MAP = {
  dashboard: <Dashboard />,
  transactions: <Transactions />,
  savings: <Savings />,
  budget: <Budget />,
  visualization: <Visualization />,
  summary: <MonthlyHistory />,
}
function App() {
  const ACTIVE_PAGE = "active_page";
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState("login");
  const [activePage, setActivePage] = useState(() => {
    const activePage = localStorage.getItem("ACTIVE_PAGE");
    return activePage && MAP[activePage] ? activePage : "dashboard";
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
    if (isAuthenticated && activePage && MAP[activePage]) {
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
        if (activePage && MAP[activePage]) {
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

    const activePage = localStorage.getItem("active_page");
    if (activePage && MAP[activePage]) {
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

    const activePage = localStorage.getItem("active_page");
    if (activePage && MAP[activePage]) {
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

  return (
      <Layout style={{ minHeight: "100vh" }}>
        <Sider
            collapsible
            collapsed={isCollapsed}
            onCollapse={setIsCollapsed}
            width={250}
            style={{
              background: "#001529",
              display: "flex",
              flexDirection: "column",
              position: "fixed",
              height: "100vh",
              left: 0,
              top: 0,
              zIndex: 100,
              overflow: "hidden",
            }}
        >
          <div className="sidebar-header">
            {isCollapsed ? (
                <img
                    className="sidebar-logo"
                    src="/vite.svg"
                    alt="Budget Tracker"
                />
            ) : (
                <Text strong style={{ color: "#fff" }}>Budget Tracker</Text>
            )}
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[activePage]}
            items={NAVIGATION_ITEMS}
            onClick={({key}) => setActivePage(key) && localStorage.setItem(ACTIVE_PAGE, key)}
            style={{ flex: 1, borderRight:0 }}
          />
          <div className="sidebar-footer">
            <Dropdown
                menu={
                  {
                    items: [
                      {
                        key: "profile",
                        icon: <UserOutlined />,
                        label: user?.username || "Profile",
                        disabled: true,
                      },
                      {type: "divider"},
                      {
                        key: "logout",
                        icon: <LogoutOutlined />,
                        label: "Logout",
                        onClick: handleLogout,
                      }
                    ],
                  }}
                placement="topLeft"
            >
              <div className="sidebar-user">
                <Avatar size="small" icon={<UserOutlined />} />
                {!isCollapsed && (
                    <Text style={{ color: "#fff", marginLeft: 8, fontSize: 15 }} ellipsis>
                      {user?.username || "User"}
                    </Text>
                )}
              </div>
            </Dropdown>

          </div>
        </Sider>
        <Layout style={{ marginLeft: isCollapsed ? 80 : 250, transition: "margin-left 0.2s" }}>
          <Content style={{ padding: "24px", minHeight: "calc(100vh - 70px)" }}>
            {MAP[activePage]}
          </Content>
          <Footer style={{ textAlign: "center", padding: "16px" }}>
            Budget Tracker © {new Date().getFullYear()}
          </Footer>
        </Layout>
      </Layout>
  );
}

export default App;