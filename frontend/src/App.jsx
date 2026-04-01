import './App.css'
import { Routes, Route, useLocation, BrowserRouter } from 'react-router-dom'
import Home from './components/Home'
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'
import Jobs from './components/Jobs'
import Browse from './components/Browse'
import Profile from './components/profile'
import JobDescription from './components/JobDescription'
import Companies from './components/admin/Companies'
import CompanyCreate from './components/admin/CompanyCreate'
import CompanySetup from './components/admin/CompanySetup'
import AdminJobs from './components/admin/AdminJobs'
import AdminJobCreate from './components/admin/AdminJobCreate'
import AdminJobSetup from './components/admin/AdminJobSetup'
import Applicants from './components/admin/Applicants'
import SavedJobs from './components/SavedJobs'

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
