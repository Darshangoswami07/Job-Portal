import { lazy, Suspense } from "react";
import { Routes, Route, useLocation, BrowserRouter, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setCredentials } from "@/store/slices/authSlice";
import axios from "axios";
import { USER_API_END_POINT } from "@/utils/constant";
import Home from "./pages/Home";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import Jobs from "./pages/Jobs";
import Browse from "./pages/Browse";
import Profile from "./components/profile/Profile";
import JobDescription from "./components/job/JobDescription";
import Companies from "./components/admin/Companies";
import CompanyCreate from "./components/admin/CompanyCreate";
import CompanySetup from "./components/admin/CompanySetup";
import AdminJobs from "./components/admin/AdminJobs";
import AdminJobCreate from "./components/admin/AdminJobCreate";
import AdminJobSetup from "./components/admin/jobs/AdminJobSetup";
import Applicants from "./components/admin/jobs/Applicants";
import AdminQuestions from "./components/admin/AdminQuestions";
import AdminResumeTemplates from "./components/admin/AdminResumeTemplates";
import AdminBlogs from "./components/admin/AdminBlogs";
import AdminBlogCreate from "./components/admin/AdminBlogCreate";
import AdminBlogEdit from "./components/admin/AdminBlogEdit";
import SavedJobs from "./pages/SavedJobs";
import BrowseCompanies from "./pages/BrowseCompanies";
import NotFound from "./components/shared/NotFound";
import ScrollToTop from "./components/shared/ScrollToTop";
import PageLoader from "./components/shared/PageLoader";

const AiResume = lazy(() => import("./pages/Careers/AiResume"));
const CoverLetter = lazy(() => import("./pages/Careers/CoverLetter"));
const MockInterview = lazy(() => import("./pages/Careers/MockInterview"));
const SalaryExplorer = lazy(() => import("./pages/Careers/SalaryExplorer"));
const CareerRoadmap = lazy(() => import("./pages/Careers/CareerRoadmap"));
const ResumeChecker = lazy(() => import("./pages/Careers/ResumeChecker"));
const Blogs = lazy(() => import("./pages/Resources/Blogs"));
const BlogDetail = lazy(() => import("./pages/Resources/BlogDetail"));
const InterviewQuestions = lazy(() => import("./pages/Resources/InterviewQuestions"));
const QuestionDetail = lazy(() => import("./pages/Resources/QuestionDetail"));
const QuestionBookmarks = lazy(() => import("./pages/Resources/QuestionBookmarks"));
const ResumeTemplates = lazy(() => import("./pages/Resources/ResumeTemplates"));
const CareerGuides = lazy(() => import("./pages/Resources/CareerGuides"));
const CareerGuideDetail = lazy(() => import("./pages/Resources/CareerGuideDetail"));
const HelpCenter = lazy(() => import("./pages/Resources/HelpCenter"));
const AdminCareerGuides = lazy(() => import("./components/admin/AdminCareerGuides"));
const AdminCareerGuideCreate = lazy(() => import("./components/admin/AdminCareerGuideCreate"));
const Pricing = lazy(() => import("./pages/Pricing"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Legal/Privacy"));
const Terms = lazy(() => import("./pages/Legal/Terms"));
const CompanyDetails = lazy(() => import("./components/company/CompanyDetails"));
const RecruiterDashboard = lazy(() => import("./components/recruiter/RecruiterDashboard"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const FeedPage = lazy(() => import("./components/social/FeedPage"));
const NetworkPage = lazy(() => import("./components/social/NetworkPage"));
const SavedPostsPage = lazy(() => import("./components/social/SavedPostsPage"));
const SearchPage = lazy(() => import("./components/social/SearchPage"));
const HashtagPage = lazy(() => import("./components/social/HashtagPage"));
const PostDetailPage = lazy(() => import("./components/social/PostDetailPage"));
const PeopleProfilePage = lazy(() => import("./components/social/PeopleProfilePage"));
const AdminSocialModeration = lazy(() => import("./components/social/AdminSocialModeration"));
const AdminJobSources = lazy(() => import("./pages/AdminJobSources"));
const AdminJobGroups = lazy(() => import("./pages/AdminJobGroups"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const RecommendedJobs = lazy(() => import("./pages/RecommendedJobs"));

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  in: { opacity: 1, y: 0 },
};

const pageTransition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.3,
};

function AuthGuard({ children }) {
  const { user } = useSelector((s) => s.auth);
  const location = useLocation();
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return children;
}

function AdminGuard({ children }) {
  const { user } = useSelector((s) => s.auth);
  const location = useLocation();
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (!user?.roles?.admin) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function PageWrapper({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      variants={pageVariants}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}

function SuspenseWrapper({ children }) {
  return (
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  );
}

function OAuthCallbackHandler() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      dispatch(setCredentials({ user: null, token }));
      const fetchProfile = async () => {
        try {
          const res = await axios.get(`${USER_API_END_POINT}/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.data.success) {
            dispatch(setCredentials({ user: res.data.user, token }));
            if (!res.data.user.profileCompleted) {
              navigate("/profile", { replace: true });
            } else {
              navigate("/", { replace: true });
            }
          } else {
            navigate("/login?error=oauth_failed", { replace: true });
          }
        } catch {
          navigate("/login?error=oauth_failed", { replace: true });
        }
      };
      fetchProfile();
    } else {
      navigate("/login?error=oauth_failed", { replace: true });
    }
  }, [dispatch, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <div className="text-center">
        <img src="/logo.png" alt="JobPilot Ai" className="size-16 object-contain mx-auto mb-6" />
        <div className="w-10 h-10 border-[3px] border-[#0A66C2] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Completing authentication...</p>
      </div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <>
      <ScrollToTop />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
          <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
          <Route path="/signup" element={<PageWrapper><Signup /></PageWrapper>} />
          <Route path="/oauth/callback" element={<OAuthCallbackHandler />} />
          <Route path="/jobs" element={<PageWrapper><Jobs /></PageWrapper>} />
          <Route path="/browse" element={<PageWrapper><Browse /></PageWrapper>} />
          <Route path="/description/:id" element={<PageWrapper><JobDescription /></PageWrapper>} />
          <Route path="/profile" element={<PageWrapper><AuthGuard><Profile /></AuthGuard></PageWrapper>} />
          <Route path="/saved-jobs" element={<PageWrapper><AuthGuard><SavedJobs /></AuthGuard></PageWrapper>} />
          <Route path="/recommended-jobs" element={<SuspenseWrapper><PageWrapper><AuthGuard><RecommendedJobs /></AuthGuard></PageWrapper></SuspenseWrapper>} />
          <Route path="/browse-companies" element={<PageWrapper><BrowseCompanies /></PageWrapper>} />
          <Route path="/company/:id" element={<SuspenseWrapper><PageWrapper><CompanyDetails /></PageWrapper></SuspenseWrapper>} />
          <Route path="/admin/dashboard" element={<SuspenseWrapper><PageWrapper><AuthGuard><RecruiterDashboard /></AuthGuard></PageWrapper></SuspenseWrapper>} />
          <Route path="/admin/companies" element={<PageWrapper><AuthGuard><Companies /></AuthGuard></PageWrapper>} />
          <Route path="/admin/companies/create" element={<PageWrapper><AuthGuard><CompanyCreate /></AuthGuard></PageWrapper>} />
          <Route path="/admin/companies/:id" element={<PageWrapper><AuthGuard><CompanySetup /></AuthGuard></PageWrapper>} />
          <Route path="/admin/jobs" element={<PageWrapper><AuthGuard><AdminJobs /></AuthGuard></PageWrapper>} />
          <Route path="/admin/jobs/create" element={<PageWrapper><AuthGuard><AdminJobCreate /></AuthGuard></PageWrapper>} />
          <Route path="/admin/jobs/:id" element={<PageWrapper><AuthGuard><AdminJobSetup /></AuthGuard></PageWrapper>} />
          <Route path="/admin/jobs/:id/applicants" element={<PageWrapper><AuthGuard><Applicants /></AuthGuard></PageWrapper>} />
          <Route path="/admin/questions" element={<PageWrapper><AuthGuard><AdminQuestions /></AuthGuard></PageWrapper>} />
          <Route path="/admin/resume-templates" element={<PageWrapper><AuthGuard><AdminResumeTemplates /></AuthGuard></PageWrapper>} />
          <Route path="/admin/blogs" element={<PageWrapper><AuthGuard><AdminBlogs /></AuthGuard></PageWrapper>} />
          <Route path="/admin/blogs/create" element={<PageWrapper><AuthGuard><AdminBlogCreate /></AuthGuard></PageWrapper>} />
          <Route path="/admin/blogs/:id" element={<PageWrapper><AuthGuard><AdminBlogEdit /></AuthGuard></PageWrapper>} />
          <Route path="/admin/career-guides" element={<PageWrapper><AuthGuard><AdminCareerGuides /></AuthGuard></PageWrapper>} />
          <Route path="/admin/career-guides/create" element={<PageWrapper><AuthGuard><AdminCareerGuideCreate /></AuthGuard></PageWrapper>} />

          <Route path="/ai-resume" element={<SuspenseWrapper><PageWrapper><AuthGuard><AiResume /></AuthGuard></PageWrapper></SuspenseWrapper>} />
          <Route path="/cover-letter" element={<SuspenseWrapper><PageWrapper><AuthGuard><CoverLetter /></AuthGuard></PageWrapper></SuspenseWrapper>} />
          <Route path="/mock-interview" element={<SuspenseWrapper><PageWrapper><AuthGuard><MockInterview /></AuthGuard></PageWrapper></SuspenseWrapper>} />
          <Route path="/mock-interview/results/:sessionId" element={<SuspenseWrapper><PageWrapper><AuthGuard><MockInterview /></AuthGuard></PageWrapper></SuspenseWrapper>} />
          <Route path="/salary-explorer" element={<SuspenseWrapper><PageWrapper><AuthGuard><SalaryExplorer /></AuthGuard></PageWrapper></SuspenseWrapper>} />
          <Route path="/career-roadmap" element={<SuspenseWrapper><PageWrapper><AuthGuard><CareerRoadmap /></AuthGuard></PageWrapper></SuspenseWrapper>} />
          <Route path="/resume-checker" element={<SuspenseWrapper><PageWrapper><AuthGuard><ResumeChecker /></AuthGuard></PageWrapper></SuspenseWrapper>} />

          <Route path="/blogs" element={<SuspenseWrapper><PageWrapper><Blogs /></PageWrapper></SuspenseWrapper>} />
          <Route path="/blogs/:slug" element={<SuspenseWrapper><PageWrapper><BlogDetail /></PageWrapper></SuspenseWrapper>} />
          <Route path="/interview-questions" element={<SuspenseWrapper><PageWrapper><InterviewQuestions /></PageWrapper></SuspenseWrapper>} />
          <Route path="/interview-questions/:id" element={<SuspenseWrapper><PageWrapper><QuestionDetail /></PageWrapper></SuspenseWrapper>} />
          <Route path="/interview-questions/bookmarks" element={<SuspenseWrapper><PageWrapper><AuthGuard><QuestionBookmarks /></AuthGuard></PageWrapper></SuspenseWrapper>} />
          <Route path="/resume-templates" element={<SuspenseWrapper><PageWrapper><ResumeTemplates /></PageWrapper></SuspenseWrapper>} />
          <Route path="/career-guides" element={<SuspenseWrapper><PageWrapper><CareerGuides /></PageWrapper></SuspenseWrapper>} />
          <Route path="/career-guides/:slug" element={<SuspenseWrapper><PageWrapper><CareerGuideDetail /></PageWrapper></SuspenseWrapper>} />
          <Route path="/help-center" element={<SuspenseWrapper><PageWrapper><HelpCenter /></PageWrapper></SuspenseWrapper>} />

          <Route path="/chat" element={<SuspenseWrapper><PageWrapper><AuthGuard><ChatPage /></AuthGuard></PageWrapper></SuspenseWrapper>} />
          <Route path="/chat/:conversationId" element={<SuspenseWrapper><PageWrapper><AuthGuard><ChatPage /></AuthGuard></PageWrapper></SuspenseWrapper>} />

          <Route path="/feed" element={<SuspenseWrapper><PageWrapper><AuthGuard><FeedPage /></AuthGuard></PageWrapper></SuspenseWrapper>} />
          <Route path="/feed/network" element={<SuspenseWrapper><PageWrapper><AuthGuard><NetworkPage /></AuthGuard></PageWrapper></SuspenseWrapper>} />
          <Route path="/feed/saved" element={<SuspenseWrapper><PageWrapper><AuthGuard><SavedPostsPage /></AuthGuard></PageWrapper></SuspenseWrapper>} />
          <Route path="/feed/search" element={<SuspenseWrapper><PageWrapper><AuthGuard><SearchPage /></AuthGuard></PageWrapper></SuspenseWrapper>} />
          <Route path="/feed/hashtag/:tag" element={<SuspenseWrapper><PageWrapper><AuthGuard><HashtagPage /></AuthGuard></PageWrapper></SuspenseWrapper>} />
          <Route path="/feed/post/:id" element={<SuspenseWrapper><PageWrapper><AuthGuard><PostDetailPage /></AuthGuard></PageWrapper></SuspenseWrapper>} />
          <Route path="/feed/:id" element={<SuspenseWrapper><PageWrapper><AuthGuard><PostDetailPage /></AuthGuard></PageWrapper></SuspenseWrapper>} />
          <Route path="/feed/people/:userId" element={<SuspenseWrapper><PageWrapper><AuthGuard><PeopleProfilePage /></AuthGuard></PageWrapper></SuspenseWrapper>} />
          <Route path="/admin/social/moderation" element={<SuspenseWrapper><PageWrapper><AuthGuard><AdminSocialModeration /></AuthGuard></PageWrapper></SuspenseWrapper>} />
          <Route path="/admin/job-sources" element={<SuspenseWrapper><PageWrapper><AdminGuard><AdminJobSources /></AdminGuard></PageWrapper></SuspenseWrapper>} />
          <Route path="/admin/job-groups" element={<SuspenseWrapper><PageWrapper><AdminGuard><AdminJobGroups /></AdminGuard></PageWrapper></SuspenseWrapper>} />
          <Route path="/admin/analytics" element={<SuspenseWrapper><PageWrapper><AdminGuard><AdminAnalytics /></AdminGuard></PageWrapper></SuspenseWrapper>} />

          <Route path="/pricing" element={<SuspenseWrapper><PageWrapper><Pricing /></PageWrapper></SuspenseWrapper>} />
          <Route path="/about" element={<SuspenseWrapper><PageWrapper><About /></PageWrapper></SuspenseWrapper>} />
          <Route path="/contact" element={<SuspenseWrapper><PageWrapper><Contact /></PageWrapper></SuspenseWrapper>} />
          <Route path="/privacy" element={<SuspenseWrapper><PageWrapper><Privacy /></PageWrapper></SuspenseWrapper>} />
          <Route path="/terms" element={<SuspenseWrapper><PageWrapper><Terms /></PageWrapper></SuspenseWrapper>} />

          <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
