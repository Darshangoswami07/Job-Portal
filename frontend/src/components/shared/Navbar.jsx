import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useScroll, useMotionValueEvent, motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useDispatch, useSelector } from "react-redux";
import {
  Sun, Moon, Menu, X, LogOut, User2, Bookmark, Briefcase,
  ChevronDown, Users, Building2, Sparkles, BookOpen, CreditCard,
  Info, Mail, FileText, Brain, Video, Route, Search, DollarSign,
  PenTool, Star, HelpCircle, MessageSquare, Shield
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Avatar, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { clearAuth, setCurrentRole } from "@/store/slices/authSlice";
import { USER_API_END_POINT } from "../../utils/constant";
import { cn } from "@/lib/utils";

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
  { name: "Find Jobs", path: "/jobs" },
  { name: "Browse Companies", path: "/browse-companies" },
];

const rightLinks = [
  { name: "Pricing", path: "/pricing", icon: CreditCard },
  { name: "About", path: "/about", icon: Info },
  { name: "Contact", path: "/contact", icon: Mail },
];

const recruiterLinks = [
  { name: "Companies", path: "/admin/companies" },
  { name: "My Jobs", path: "/admin/jobs" },
  { name: "Messages", path: "/messages" },
  { name: "Questions", path: "/admin/questions" },
  { name: "Templates", path: "/admin/resume-templates" },
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

function NavLink({ to, children, className, onClick }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "px-4 py-2 text-sm font-medium transition-colors rounded-lg",
        isActive
          ? "text-[#0A66C2] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
          : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800",
        className
      )}
    >
      {children}
    </Link>
  );
}

function DropdownNav({ label, items, isOpen, onToggle, onClose }) {
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
          "flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors rounded-lg",
          isAnyActive
            ? "text-[#0A66C2] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
            : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
      >
        {label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50"
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
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
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

function MessagesBadge({ count }) {
  if (!count) return null;
  return (
    <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0A66C2] px-1 text-[10px] font-semibold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function Navbar() {
  const { user } = useSelector((store) => store.auth);
  const { unreadCount } = useSelector((store) => store.chat);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { scrollY } = useScroll();
  const lastScrollY = useRef(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [compact, setCompact] = useState(false);
  const [themeRotate, setThemeRotate] = useState(false);
  const [careerOpen, setCareerOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [mobileCareerOpen, setMobileCareerOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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

  const closeAllDropdowns = () => {
    setCareerOpen(false);
    setResourcesOpen(false);
  };

  const isRecruiter = user?.currentRole === "recruiter";

  return (
    <>
      <motion.nav
        initial="hidden"
        animate="visible"
        variants={navVariants}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn(
          "sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 transition-all duration-300",
          scrolled
            ? "bg-white/80 dark:bg-gray-950/80 backdrop-blur-md shadow-sm"
            : "bg-white dark:bg-gray-950"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={cn("flex items-center justify-between transition-all duration-300", compact ? "h-14" : "h-16")}>
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <Briefcase className="size-6 text-[#0A66C2]" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">JobHub</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {isRecruiter ? (
                recruiterLinks.map((link) => (
                  <NavLink key={link.path} to={link.path}>
                    {link.name}
                    {link.name === "Messages" && <MessagesBadge count={unreadCount} />}
                  </NavLink>
                ))
              ) : (
                <>
                  {mainLinks.map((link) => (
                    <NavLink key={link.path} to={link.path}>{link.name}</NavLink>
                  ))}
                  <DropdownNav
                    label="Career Tools"
                    items={careerTools}
                    isOpen={careerOpen}
                    onToggle={() => { setCareerOpen(!careerOpen); setResourcesOpen(false); }}
                    onClose={() => setCareerOpen(false)}
                  />
                  <DropdownNav
                    label="Resources"
                    items={resourcesLinks}
                    isOpen={resourcesOpen}
                    onToggle={() => { setResourcesOpen(!resourcesOpen); setCareerOpen(false); }}
                    onClose={() => setResourcesOpen(false)}
                  />
                  {user && (
                    <NavLink to="/messages">
                      Messages
                      <MessagesBadge count={unreadCount} />
                    </NavLink>
                  )}
                  {rightLinks.map((link) => (
                    <NavLink key={link.path} to={link.path}>{link.name}</NavLink>
                  ))}
                </>
              )}
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              {user?.roles?.jobSeeker && user?.roles?.recruiter && (
                <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-1 py-0.5 shadow-sm">
                  <button
                    onClick={() => dispatch(setCurrentRole("jobSeeker"))}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                      user?.currentRole === "jobSeeker"
                        ? "bg-[#0A66C2] text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    )}
                  >
                    <Users className="h-3.5 w-3.5" />
                    Job Seeker
                  </button>
                  <button
                    onClick={() => dispatch(setCurrentRole("recruiter"))}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                      user?.currentRole === "recruiter"
                        ? "bg-[#0A66C2] text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    )}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    Recruiter
                  </button>
                </div>
              )}
              {mounted && (
                <motion.button
                  animate={{ rotate: themeRotate ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  onClick={toggleTheme}
                  className="flex size-9 items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
                </motion.button>
              )}

              {!user ? (
                <div className="hidden md:flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="btn-secondary text-gray-600 dark:text-gray-400">Login</Button>
                  </Link>
                  <Link to="/signup">
                    <Button size="sm" className="btn-primary">Signup</Button>
                  </Link>
                </div>
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <Avatar className="size-9 cursor-pointer ring-2 ring-gray-200 hover:ring-[#0A66C2] transition-all dark:ring-gray-700 dark:hover:ring-[#0A66C2]">
                      <AvatarImage src={user?.profile?.profilePhoto} alt={user?.fullname} />
                    </Avatar>
                  </PopoverTrigger>
                  <PopoverContent align="end" sideOffset={8} className="w-64 p-0 overflow-hidden bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-lg rounded-lg">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10">
                          <AvatarImage src={user?.profile?.profilePhoto} alt={user?.fullname} />
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{user?.fullname}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      {(!user?.roles?.recruiter || user?.currentRole === "jobSeeker") && (
                        <>
                          <Link to="/profile" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors">
                            <User2 className="size-4" /> View Profile
                          </Link>
                          <Link to="/messages" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors">
                            <MessageSquare className="size-4" /> Messages
                            <MessagesBadge count={unreadCount} />
                          </Link>
                          <Link to="/saved-jobs" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors">
                            <Bookmark className="size-4" /> Saved Jobs
                          </Link>
                        </>
                      )}
                      <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors">
                        <LogOut className="size-4" /> Logout
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden flex size-9 items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
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
          <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 z-40 bg-black/50 md:hidden" />
          <motion.div
            variants={drawerVariants}
            initial="closed"
            animate="open"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-white dark:bg-gray-950 shadow-xl md:hidden"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Briefcase className="size-5 text-[#0A66C2]" />
                  <span className="text-lg font-bold text-gray-900 dark:text-white">JobHub</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="flex size-8 items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors" aria-label="Close menu">
                  <X className="size-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-4">
                <div className="space-y-1">
                  {isRecruiter ? (
                    recruiterLinks.map((link) => (
                      <Link key={link.path} to={link.path} onClick={() => setIsMobileMenuOpen(false)}
                        className={cn("flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          location.pathname === link.path
                            ? "text-[#0A66C2] bg-blue-50 dark:bg-blue-900/30"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
                        )}>
                        {link.name}
                        {link.name === "Messages" && <MessagesBadge count={unreadCount} />}
                      </Link>
                    ))
                  ) : (
                    <>
                      {[...mainLinks, ...rightLinks].map((link) => (
                        <Link key={link.path} to={link.path} onClick={() => setIsMobileMenuOpen(false)}
                          className={cn("flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
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
                        className="flex items-center justify-between w-full rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
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
                        className="flex items-center justify-between w-full rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
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
                      <Button variant="outline" className="w-full btn-secondary text-gray-600 dark:text-gray-400">Login</Button>
                    </Link>
                    <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full btn-primary">Signup</Button>
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
                      {(!user?.roles?.recruiter || user?.currentRole === "jobSeeker") && (
                        <>
                          <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors">
                            <User2 className="size-4" /> View Profile
                          </Link>
                          <Link to="/messages" onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors">
                            <MessageSquare className="size-4" /> Messages
                            <MessagesBadge count={unreadCount} />
                          </Link>
                          <Link to="/saved-jobs" onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors">
                            <Bookmark className="size-4" /> Saved Jobs
                          </Link>
                        </>
                      )}
                      <button onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors">
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
