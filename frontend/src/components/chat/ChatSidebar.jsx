import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Home,
  Briefcase,
  Building2,
  Bookmark,
  User2,
  MessageSquare,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import axios from "axios";
import { clearAuth } from "@/store/slices/authSlice";
import { USER_API_END_POINT } from "@/utils/constant";
import { selectUnreadTotal } from "@/store/slices/chatSlice";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/jobs", icon: Briefcase, label: "Find Jobs" },
  { to: "/browse-companies", icon: Building2, label: "Companies" },
  { to: "/saved-jobs", icon: Bookmark, label: "Saved Jobs" },
  { to: "/profile", icon: User2, label: "Profile" },
];

export default function ChatSidebar({ unreadTotal }) {
  const { theme, setTheme } = useTheme();
  const dispatch = useDispatch();
  const location = useLocation();
  const total = useSelector(selectUnreadTotal) ?? unreadTotal ?? 0;

  const handleLogout = async () => {
    try {
      const res = await axios.get(`${USER_API_END_POINT}/logout`, { withCredentials: true });
      if (res.data.success) {
        dispatch(clearAuth());
        toast.success("Logged out");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Logout failed");
    }
  };

  return (
    <motion.aside
      initial={{ x: -24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="hidden w-16 shrink-0 flex-col items-center gap-1.5 border-r border-slate-200/80 bg-white/70 py-3 backdrop-blur-xl lg:flex dark:border-slate-800 dark:bg-slate-900/60"
      aria-label="Chat navigation"
    >
      <NavLink to="/" className="mb-2">
        <img src="/logo.png" alt="JobPilot Ai" className="h-9 w-9 rounded-xl object-contain" />
      </NavLink>

      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          title={label}
          className={({ isActive }) =>
            cn(
              "group flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
              isActive
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            )
          }
        >
          <Icon className="h-5 w-5" />
        </NavLink>
      ))}

      <div className="relative flex h-10 w-10 items-center justify-center">
        <NavLink
          to="/chat"
          title="Messages"
          className={({ isActive }) =>
            cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
              isActive || location.pathname.startsWith("/chat")
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            )
          }
        >
          <MessageSquare className="h-5 w-5" />
        </NavLink>
        {total > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-sm">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </div>

      <div className="flex-1" />

      <button
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <button
        type="button"
        onClick={handleLogout}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
        aria-label="Logout"
        title="Logout"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </motion.aside>
  );
}
