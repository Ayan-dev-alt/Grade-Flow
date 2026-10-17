import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  AlertCircle,
  Bell,
  LifeBuoy,
} from "lucide-react";
import Logo from "./Logo";
import { getFriendlyErrorMessage, logout } from "../firebase/firebase";

const teacherItems = [
  ["Dashboard", "/teacher", LayoutDashboard],
  ["Students", "/teacher/students", Users],
  ["Subjects", "/teacher/subjects", BookOpen],
  ["Results", "/teacher/results", ClipboardList],
  ["Reports", "/teacher/reports", BarChart3],
  ["Complaints", "/teacher/complaints", AlertCircle],
  ["Settings", "/teacher/settings", Settings],
];

export default function Sidebar({ admin = false }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const navigate = useNavigate();
  const items = admin
    ? [
        ["Dashboard", "/admin", LayoutDashboard],
        ["Teachers", "/admin/teachers", Users],
        ["Teacher Support", "/admin/support", LifeBuoy],
        ["Complaints", "/admin/complaints", AlertCircle],
        ["Notifications", "/admin/notifications", Bell],
        ["Teacher Plans", "/admin/payments", ClipboardList],
        ["Settings", "/admin/settings", Settings],
      ]
    : teacherItems;

  const handleLogout = async () => {
    setLogoutError("");
    try {
      await logout();
      navigate("/auth", { replace: true });
    } catch (error) {
      setLogoutError(getFriendlyErrorMessage(error, "We couldn't sign you out. Check your connection and try again."));
    }
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen((current) => !current)}
        className="fixed left-4 top-4 z-40 rounded-xl border border-white/10 bg-slate-900/90 p-2 text-slate-200 shadow-lg lg:hidden"
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {mobileOpen && (
        <button
          type="button"
          onClick={closeMobile}
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-white/10 bg-slate-950/95 px-4 py-5 transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } lg:block`}
      >
        <div className="mb-8 px-2">
          <Logo />
        </div>
        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[.18em] text-slate-500">
          {admin ? "Administration" : "Teacher Panel"}
        </p>
        <nav className="space-y-1.5">
          {items.map(([label, to, Icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/teacher" || to === "/admin"}
              onClick={closeMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${isActive ? "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white"}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-5 left-4 right-4">
          <div className="mb-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4">
            <div className="mb-2 flex items-center gap-2 text-indigo-300">
              <ShieldCheck size={17} />
              <span className="text-xs font-bold">Secure Workspace</span>
            </div>
            <p className="text-xs leading-5 text-slate-400">
              Your account and workspace records are protected by Firebase.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <LogOut size={18} /> Logout
          </button>
          {logoutError && <p role="alert" className="mt-2 px-3 text-xs leading-5 text-rose-300">{logoutError}</p>}
        </div>
      </aside>
    </>
  );
}
