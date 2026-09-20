import { Link } from "react-router-dom";
import { Linkedin, Github, Globe, Sparkles, BookOpen } from "lucide-react";

const socialLinks = [
  { icon: Github, href: "https://github.com/abhishekbisht0203", label: "GitHub" },
  { icon: Linkedin, href: "https://linkedin.com/in/abhishek-bisht-876541308", label: "LinkedIn" },
  { icon: Globe, href: "https://abhishekbisht.vercel.app/", label: "Portfolio" },
];

const quickLinks = [
  { name: "Home", path: "/" },
  { name: "Find Jobs", path: "/jobs" },
  { name: "Browse Companies", path: "/browse-companies" },
  { name: "Pricing", path: "/pricing" },
  { name: "About Us", path: "/about" },
  { name: "Contact", path: "/contact" },
];

const careerToolLinks = [
  { name: "AI Resume Builder", path: "/ai-resume" },
  { name: "Cover Letter", path: "/cover-letter" },
  { name: "Mock Interview", path: "/mock-interview" },
  { name: "Salary Explorer", path: "/salary-explorer" },
  { name: "Career Roadmap", path: "/career-roadmap" },
  { name: "Resume Checker", path: "/resume-checker" },
];

const resourceLinks = [
  { name: "Blogs", path: "/blogs" },
  { name: "Interview Questions", path: "/interview-questions" },
  { name: "Resume Templates", path: "/resume-templates" },
  { name: "Career Guides", path: "/career-guides" },
  { name: "Help Center", path: "/help-center" },
];

const employerLinks = [
  { name: "Post a Job", path: "/signup" },
  { name: "Browse Candidates", path: "/browse" },
  { name: "Pricing Plans", path: "/pricing" },
];

export default function Footer() {
  return (
    <footer className="bg-[#1D2226]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-5">
              <img src="/logo.png" alt="JobPilot Ai" className="size-10 object-contain brightness-0 invert" />
              <span className="text-xl font-bold text-white">JobPilot Ai</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your premier destination for connecting top talent with leading companies.
            </p>
            <div className="flex items-center gap-2.5 mt-6">
              {socialLinks.map((social) => (
                <a key={social.label} href={social.href} aria-label={social.label} title={social.label}
                  target="_blank" rel="noopener noreferrer"
                  className="flex size-9 items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 hover:-translate-y-0.5 hover:rotate-3 transition-all duration-300">
                  <social.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-5">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link to={link.path}
                    className="relative text-sm text-gray-400 hover:text-white transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-white after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-5 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-400" /> Career Tools
            </h4>
            <ul className="space-y-3">
              {careerToolLinks.map((link) => (
                <li key={link.name}>
                  <Link to={link.path}
                    className="relative text-sm text-gray-400 hover:text-white transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-white after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-5 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-400" /> Resources
            </h4>
            <ul className="space-y-3">
              {resourceLinks.map((link) => (
                <li key={link.name}>
                  <Link to={link.path}
                    className="relative text-sm text-gray-400 hover:text-white transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-white after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-5">For Employers</h4>
            <ul className="space-y-3">
              {employerLinks.map((link) => (
                <li key={link.name}>
                  <Link to={link.path}
                    className="relative text-sm text-gray-400 hover:text-white transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-white after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} JobPilot Ai. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-gray-300 transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
