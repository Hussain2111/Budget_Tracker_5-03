import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Target,
  BarChart2,
  FileText,
  LogOut,
  Leaf,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { key: "dashboard",     label: "Dashboard",     icon: LayoutDashboard },
  { key: "transactions",  label: "Transactions",  icon: ArrowLeftRight },
  { key: "savings",       label: "Savings",       icon: PiggyBank },
  { key: "budget",        label: "Budget",        icon: Target },
  { key: "visualization", label: "Visualize",     icon: BarChart2 },
  { key: "summary",       label: "Summary",       icon: FileText },
];

export default function Sidebar({ currentPage, onNavigate, user, onLogout, className, onClose }) {
  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "?";

  return (
    <aside className={`sidebar ${className || ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-mark">
          <Leaf size={14} color="white" strokeWidth={2.5} />
        </div>
        <span className="logo-name">Fina</span>
        <button className="sidebar-close-btn" onClick={onClose}>
          <X size={18} color="rgba(255,255,255,0.7)" />
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Menu</div>
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            className={`nav-item ${currentPage === key ? "active" : ""}`}
            onClick={() => {
              onNavigate(key);
              onClose?.();
            }}
          >
            <Icon size={14} strokeWidth={currentPage === key ? 2.5 : 2} />
            {label}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="avatar">{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sidebar-user-name">{user?.username || "User"}</div>
          <div className="sidebar-user-plan">Free plan</div>
        </div>
        <div
          style={{ cursor: "pointer", opacity: 0.4, flexShrink: 0 }}
          onClick={onLogout}
          title="Log out"
        >
          <LogOut size={13} color="white" />
        </div>
      </div>
    </aside>
  );
}
