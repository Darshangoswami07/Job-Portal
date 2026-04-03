import './App.css'
import { Routes, Route, useLocation, BrowserRouter } from 'react-router-dom'
import Home from './pages/Home'
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'
import Jobs from './pages/Jobs'
import Browse from './pages/Browse'
import Profile from './components/profile/Profile'
import JobDescription from './components/job/JobDescription'
import Companies from './components/admin/companies/Companies'
import CompanyCreate from './components/admin/companies/CompanyCreate'
import CompanySetup from './components/admin/companies/CompanySetup'
import AdminJobs from './components/admin/jobs/AdminJobs'
import AdminJobCreate from './components/admin/jobs/AdminJobCreate'
import AdminJobSetup from './components/admin/jobs/AdminJobSetup'
import Applicants from './components/admin/jobs/Applicants'
import SavedJobs from './pages/SavedJobs'

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/browse" element={<Browse />} />
      <Route path="/description/:id" element={<JobDescription />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/saved-jobs" element={<SavedJobs />} />
      <Route path="/admin/companies" element={<Companies />} />
      <Route path="/admin/companies/create" element={<CompanyCreate />} />
      <Route path="/admin/companies/:id" element={<CompanySetup />} />
      <Route path="/admin/jobs" element={<AdminJobs />} />
      <Route path="/admin/jobs/create" element={<AdminJobCreate />} />
      <Route path="/admin/jobs/:id" element={<AdminJobSetup />} />
      <Route path="/admin/jobs/:id/applicants" element={<Applicants />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}

export default App
