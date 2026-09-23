import { History, LogOut, Plus, Sparkles } from "lucide-react";
import { NavLink, useNavigate } from "react-router";
import { useAuth } from "../../features/auth/hooks/useAuth";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/new-interview", label: "New interview" },
  { to: "/history", label: "History", icon: History },
];

export default function AppShell({ children }) {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();
  const signOut = async () => { await handleLogout(); navigate("/login"); };
  return <div className="app-shell">
    <header className="site-header">
      <NavLink className="brand" to="/"><span className="brand-mark"><Sparkles size={17} /></span> Interview<span>AI</span></NavLink>
      <nav aria-label="Primary navigation">{links.map(({ to, label, end, icon: Icon }) => <NavLink key={to} end={end} to={to} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>{Icon && <Icon size={16} />}{label}</NavLink>)}</nav>
      <div className="account"><span className="account-name">{user?.username}</span><button className="icon-button" onClick={signOut} aria-label="Log out"><LogOut size={18} /></button></div>
    </header>
    <main className="app-main">{children}</main>
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <NavLink end to="/">Dashboard</NavLink><NavLink to="/new-interview"><Plus size={18} />New</NavLink><NavLink to="/history">History</NavLink>
    </nav>
  </div>;
}
