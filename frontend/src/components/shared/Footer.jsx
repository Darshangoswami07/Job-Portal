import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Github, Mail } from "lucide-react";

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Github, href: "#", label: "GitHub" },
];

const quickLinks = [
  { name: "Home", path: "/" },
  { name: "Find Jobs", path: "/jobs" },
  { name: "Browse Companies", path: "/browse" },
  { name: "About Us", path: "/about" },
  { name: "Contact", path: "/contact" },
];

const employerLinks = [
  { name: "Post a Job", path: "/signup" },
  { name: "Browse Candidates", path: "/browse" },
  { name: "Pricing Plans", path: "#" },
  { name: "Hire Talent", path: "#" },
];

export default function Footer() {
  return (
    <footer className="bg-[#1D2226]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl font-bold text-white">JobHub</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your premier destination for connecting top talent with leading
              companies. We make hiring and job searching seamless, smart, and
              successful.
            </p>
            <div className="flex items-center gap-2.5 mt-5">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex size-9 items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 hover:-translate-y-0.5 hover:rotate-3 transition-all duration-300"
                >
                  <social.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="relative text-sm text-gray-400 hover:text-white transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-white after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">For Employers</h4>
            <ul className="space-y-2.5">
              {employerLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="relative text-sm text-gray-400 hover:text-white transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-white after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Connect</h4>
            <div className="space-y-3">
              <a
                href="mailto:support@jobhub.com"
                className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <Mail className="size-4 shrink-0" />
                support@jobhub.com
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} JobHub. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="#" className="hover:text-gray-300 transition-colors">
                Privacy Policy
              </Link>
              <Link to="#" className="hover:text-gray-300 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
