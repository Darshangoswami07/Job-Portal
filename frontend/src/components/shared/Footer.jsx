import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-4 gap-8">
        
        {/* Logo + Description */}
        <div>
          <h2 className="text-2xl font-bold text-white">
            Job<span className="text-red-500">Portal</span>
          </h2>
          <p className="mt-4 text-sm">
            Find your dream job or hire the best talent with our trusted job
            portal platform.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            Quick Links
          </h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-white">Home</Link></li>
            <li><Link to="/jobs" className="hover:text-white">Browse Jobs</Link></li>
            <li><Link to="/signup" className="hover:text-white">Signup</Link></li>
            <li><Link to="/login" className="hover:text-white">Login</Link></li>
          </ul>
        </div>

        {/* For Employers */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            For Employers
          </h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="#" className="hover:text-white">Post a Job</Link></li>
            <li><Link to="#" className="hover:text-white">Browse Candidates</Link></li>
            <li><Link to="#" className="hover:text-white">Pricing Plans</Link></li>
          </ul>
        </div>

        {/* Social Media */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            Follow Us
          </h3>
          <div className="flex space-x-4">
            <Facebook className="hover:text-white cursor-pointer" />
            <Twitter className="hover:text-white cursor-pointer" />
            <Linkedin className="hover:text-white cursor-pointer" />
            <Github className="hover:text-white cursor-pointer" />
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700 text-center py-4 text-sm">
        © {new Date().getFullYear()} JobPortal. All rights reserved.
      </div>
    </footer>
  );
}
