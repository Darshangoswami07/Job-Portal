import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useScroll, useMotionValueEvent, motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useDispatch, useSelector } from "react-redux";
import {
  Sun, Moon, Menu, X, LogOut, User2, Bookmark,
  ChevronDown, Building2, Sparkles, BookOpen, CreditCard,
  Info, Mail, FileText, Brain, Video, Route, Search, DollarSign,
  PenTool, Star, HelpCircle, Plus, LayoutDashboard, BadgeCheck, Home, MessageSquare, ServerCog, Layers, BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Avatar, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { clearAuth } from "@/store/slices/authSlice";
import { USER_API_END_POINT } from "../../utils/constant";
import { cn } from "@/lib/utils";
import NotificationCenter from "../recruiter/NotificationCenter";
import { selectUnreadTotal } from "@/store/slices/chatSlice";

const careerTools = [
  { name: "AI Resume Builder", path: "/ai-resume", icon: Sparkles },
  { name: "Cover Letter", path: "/cover-letter", icon: PenTool },
  { name: "Mock Interview", path: "/mock-interview", icon: Video },
  { name: "Salary Explorer", path: "/salary-explorer", icon: DollarSign },
  { name: "Career Roadmap", path: "/career-roadmap", icon: Route },
  { name: "Resume Checker", path: "/resume-checker", icon: Search },
];

const resourcesLinks = [
  { name: "Blogs", path: "/blogs", icon: BookOpen },
  { name: "Interview Questions", path: "/interview-questions", icon: Brain },
  { name: "Resume Templates", path: "/resume-templates", icon: FileText },
  { name: "Career Guides", path: "/career-guides", icon: Star },
  { name: "Help Center", path: "/help-center", icon: HelpCircle },
];

const mainLinks = [
  { name: "Home", path: "/" },
  { name: "Feed", path: "/feed" },
  { name: "Find Jobs", path: "/jobs" },
  { name: "For You", path: "/recommended-jobs", authOnly: true },
  { name: "Browse Companies", path: "/browse-companies" },
];

const rightLinks = [
  { name: "Pricing", path: "/pricing" },
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact" },
];

const recruiterLinks = [
  { name: "Home", path: "/", icon: Home },
  { name: "Feed", path: "/feed", icon: Home },
  { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Companies", path: "/admin/companies", icon: Building2 },
  { name: "My Jobs", path: "/admin/jobs", icon: FileText },
  { name: "Questions", path: "/admin/questions", icon: HelpCircle },
  { name: "Templates", path: "/admin/resume-templates", icon: PenTool },
];

const drawerVariants = {
  closed: { x: "100%" },
  open: { x: 0 },
};

const navVariants = {
  hidden: { y: "-100%", opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const dropdownVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.1 } },
};

function NavLink({ to, children, className, onClick, compact }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "group relative whitespace-nowrap rounded-lg px-3 py-2 text-[15px] font-medium transition-colors duration-200",
        compact ? "py-1.5" : "py-2",
        isActive
          ? "text-[#0A66C2] dark:text-blue-400"
          : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
        className
      )}
    >
      {isActive && (
        <motion.span
          layoutId="nav-active-pill"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="absolute inset-0 rounded-lg bg-blue-50 dark:bg-blue-900/30"
        />
      )}
      <span className="relative z-10">{children}</span>
      <span
        className={cn(
          "absolute bottom-1 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-[#0A66C2] dark:bg-blue-400 transition-all duration-300",
          isActive ? "w-5" : "w-0 group-hover:w-3.5"
        )}
      />
    </Link>
  );
}

function DropdownNav({ label, items, isOpen, onToggle, onClose, compact }) {
  const location = useLocation();
  const isAnyActive = items.some((item) => location.pathname === item.path);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center whitespace-nowrap gap-1 rounded-lg px-3 py-2 text-[15px] font-medium transition-colors",
          compact ? "py-1.5" : "py-2",
          isAnyActive
            ? "text-[#0A66C2] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
            : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
      >
        {label}
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-full left-0 mt-2 w-60 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl z-50"
          >
            <div className="p-1.5">
              {items.map((item) => {
                const Icon = item.icon;
                const isItemActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      isItemActive
                        ? "text-[#0A66C2] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const { user } = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { scrollY } = useScroll();
  const lastScrollY = useRef(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [scrolled, setScrolled] = useState(false);
  const [compact, setCompact] = useState(false);
  const [themeRotate, setThemeRotate] = useState(false);
  const [careerOpen, setCareerOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [mobileCareerOpen, setMobileCareerOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (isMobileMenuOpen && Math.abs(latest - lastScrollY.current) > 10) {
      setIsMobileMenuOpen(false);
    }
    setScrolled(latest > 20);
    setCompact(latest > 100);
    lastScrollY.current = latest;
  });

  const handleLogout = async () => {
    try {
      const res = await axios.get(`${USER_API_END_POINT}/logout`, { withCredentials: true });
      if (res.data.success) {
        dispatch(clearAuth());
        navigate("/");
        toast.success(res.data.message);
        setIsMobileMenuOpen(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
    }
  };

  const toggleTheme = () => {
    setThemeRotate(true);
    setTheme(theme === "dark" ? "light" : "dark");
    setTimeout(() => setThemeRotate(false), 300);
  };

  const isRecruiter = user?.currentRole === "recruiter";
  const unreadChat = useSelector(selectUnreadTotal);

  return (
    <>
      <motion.nav
        initial="hidden"
        animate="visible"
        variants={navVariants}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn(
          "sticky top-0 z-50 border-b transition-all duration-300",
          scrolled
            ? "border-gray-200/70 dark:border-gray-800/70 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl shadow-sm"
            : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
        )}
      >
        <div className="mx-auto w-full max-w-[1400px] px-5 lg:px-8">
          <div className={cn("flex items-center justify-between transition-all duration-300", compact ? "h-16" : "h-[72px]")}>

            {/* LEFT — Logo + Brand */}
            <Link
              to={isRecruiter ? "/admin/dashboard" : "/"}
              className="flex shrink-0 items-center gap-2.5"
            >
              <img src="/logo.png" alt="JobPilot Ai" className="h-9 w-9 object-contain" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400 select-none">
                JobPilot Ai
              </span>
            </Link>

            {/* CENTER — Navigation */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="flex items-center gap-0.5 xl:gap-1">
                {isRecruiter ? (
                  recruiterLinks.map((link) => (
                    <NavLink key={link.path} to={link.path} compact={compact}>{link.name}</NavLink>
                  ))
                ) : (
                  <>
                    {mainLinks.filter((link) => !link.authOnly || user).map((link) => (
                      <NavLink key={link.path} to={link.path} compact={compact}>{link.name}</NavLink>
                    ))}
                    <DropdownNav
                      label="Career Tools"
                      items={careerTools}
                      isOpen={careerOpen}
                      onToggle={() => { setCareerOpen(!careerOpen); setResourcesOpen(false); }}
                      onClose={() => setCareerOpen(false)}
                      compact={compact}
                    />
                    <DropdownNav
                      label="Resources"
                      items={resourcesLinks}
                      isOpen={resourcesOpen}
                      onToggle={() => { setResourcesOpen(!resourcesOpen); setCareerOpen(false); }}
                      onClose={() => setResourcesOpen(false)}
                      compact={compact}
                    />
                    {rightLinks.map((link) => (
                      <NavLink key={link.path} to={link.path} compact={compact}>{link.name}</NavLink>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* RIGHT — Actions */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {mounted && (
                <motion.button
                  animate={{ rotate: themeRotate ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  onClick={toggleTheme}
                  className="flex size-10 items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
                </motion.button>
              )}

              {!user ? (
                <div className="hidden md:flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="btn-secondary text-gray-600 dark:text-gray-400 rounded-xl">Login</Button>
                  </Link>
                  <Link to="/signup">
                    <Button size="sm" className="btn-primary rounded-xl">Signup</Button>
                  </Link>
                </div>
              ) : (
                <>
                  {isRecruiter && (
                    <Button
                      size="sm"
                      onClick={() => navigate("/admin/jobs/create")}
                      className="hidden lg:flex rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-600 hover:to-blue-700"
                    >
                      <Plus className="size-4" /> Post a Job
                    </Button>
                  )}

                  <Link
                    to="/chat"
                    className="relative flex size-10 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                    aria-label="Messages"
                    title="Messages"
                  >
                    <MessageSquare className="size-[18px]" />
                    {unreadChat > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-sm">
                        {unreadChat > 99 ? "99+" : unreadChat}
                      </span>
                    )}
                  </Link>

                  <NotificationCenter />

                  <Popover>
                    <PopoverTrigger asChild>
                      <Avatar className="size-10 cursor-pointer ring-2 ring-gray-200 transition-all hover:ring-[#0A66C2] dark:ring-gray-700 dark:hover:ring-[#0A66C2]">
                        <AvatarImage src={user?.profile?.profilePhoto} alt={user?.fullname} />
                      </Avatar>
                    </PopoverTrigger>
                    <PopoverContent align="end" sideOffset={10} className="w-72 p-0 overflow-hidden rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-2xl">
                      <div className="bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-transparent p-4 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-11">
                            <AvatarImage src={user?.profile?.profilePhoto} alt={user?.fullname} />
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{user?.fullname}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                              <BadgeCheck className="size-3" />
                              {user?.currentRole === "recruiter" ? "Recruiter" : "Job Seeker"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        <Link to="/profile" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors">
                          <User2 className="size-4" /> View Profile
                        </Link>
                        {user?.currentRole === "recruiter" ? (
                          <Link to="/admin/dashboard" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors">
                            <LayoutDashboard className="size-4" /> Recruiter Dashboard
                          </Link>
                        ) : (
                          <Link to="/saved-jobs" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors">
                            <Bookmark className="size-4" /> Saved Jobs
                          </Link>
                        )}
                        {user?.roles?.admin && (
                          <Link to="/admin/job-sources" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors">
                            <ServerCog className="size-4" /> Job Sources
                          </Link>
                        )}
                        {user?.roles?.admin && (
                          <Link to="/admin/job-groups" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors">
                            <Layers className="size-4" /> Job Groups
                          </Link>
                        )}
                        {user?.roles?.admin && (
                          <Link to="/admin/analytics" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors">
                            <BarChart3 className="size-4" /> Analytics
                          </Link>
                        )}
                        <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors">
                          <LogOut className="size-4" /> Logout
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </>
              )}

              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden flex size-10 items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {isMobileMenuOpen && (
        <>
          <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" />
          <motion.div
            variants={drawerVariants}
            initial="closed"
            animate="open"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] bg-white dark:bg-gray-950 shadow-2xl lg:hidden"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="JobPilot Ai" className="size-9 object-contain" />
                  <span className="text-lg font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400">JobPilot Ai</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="flex size-8 items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors" aria-label="Close menu">
                  <X className="size-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-4">
                {isRecruiter && user && (
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); navigate("/admin/jobs/create"); }}
                    className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25"
                  >
                    <Plus className="size-4" /> Post a New Job
                  </button>
                )}
                <div className="space-y-1">
                  {isRecruiter ? (
                    recruiterLinks.map((link) => (
                      <Link key={link.path} to={link.path} onClick={() => setIsMobileMenuOpen(false)}
                        className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                          location.pathname === link.path
                            ? "text-[#0A66C2] bg-blue-50 dark:bg-blue-900/30"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
                        )}>
                        <link.icon className="size-4" />
                        {link.name}
                      </Link>
                    ))
                  ) : (
                    <>
                      {[...mainLinks, ...rightLinks].filter((link) => !link.authOnly || user).map((link) => (
                        <Link key={link.path} to={link.path} onClick={() => setIsMobileMenuOpen(false)}
                          className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                            location.pathname === link.path
                              ? "text-[#0A66C2] bg-blue-50 dark:bg-blue-900/30"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
                          )}>
                          {link.name}
                        </Link>
                      ))}

                      <div className="border-t border-gray-100 dark:border-gray-800 my-2" />

                      <button
                        onClick={() => setMobileCareerOpen(!mobileCareerOpen)}
                        className="flex items-center justify-between w-full rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
                      >
                        <span>Career Tools</span>
                        <ChevronDown className={cn("h-4 w-4 transition-transform", mobileCareerOpen && "rotate-180")} />
                      </button>
                      {mobileCareerOpen && (
                        <div className="ml-3 space-y-0.5 border-l-2 border-blue-200 dark:border-blue-800 pl-2">
                          {careerTools.map((item) => (
                            <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)}
                              className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                location.pathname === item.path
                                  ? "text-[#0A66C2] bg-blue-50 dark:bg-blue-900/30"
                                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
                              )}>
                              <item.icon className="h-4 w-4" /> {item.name}
                            </Link>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => setMobileResourcesOpen(!mobileResourcesOpen)}
                        className="flex items-center justify-between w-full rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
                      >
                        <span>Resources</span>
                        <ChevronDown className={cn("h-4 w-4 transition-transform", mobileResourcesOpen && "rotate-180")} />
                      </button>
                      {mobileResourcesOpen && (
                        <div className="ml-3 space-y-0.5 border-l-2 border-blue-200 dark:border-blue-800 pl-2">
                          {resourcesLinks.map((item) => (
                            <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)}
                              className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                location.pathname === item.path
                                  ? "text-[#0A66C2] bg-blue-50 dark:bg-blue-900/30"
                                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
                              )}>
                              <item.icon className="h-4 w-4" /> {item.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-4 space-y-3">
                {!user ? (
                  <div className="flex flex-col gap-2">
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full btn-secondary text-gray-600 dark:text-gray-400 rounded-xl">Login</Button>
                    </Link>
                    <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full btn-primary rounded-xl">Signup</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-1">
                      <Avatar className="size-9">
                        <AvatarImage src={user?.profile?.profilePhoto} alt={user?.fullname} />
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{user?.fullname}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors">
                        <User2 className="size-4" /> View Profile
                      </Link>
                      {user?.currentRole !== "recruiter" && (
                        <Link to="/saved-jobs" onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors">
                          <Bookmark className="size-4" /> Saved Jobs
                        </Link>
                      )}
                      <button onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors">
                        <LogOut className="size-4" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </>
  );
}
