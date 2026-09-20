import { useState } from "react";
import { motion } from "framer-motion";
import { Search, HelpCircle, MessageCircle, FileText, Mail, ChevronDown, Phone, ExternalLink, ArrowRight } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import PageHero from "@/components/sections/PageHero";
import CTABanner from "@/components/sections/CTABanner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const faqs = [
  { q: "How do I create an account?", a: "Click the 'Sign Up' button on the top right corner. You can register using your email or connect with Google/GitHub for a faster setup." },
  { q: "How do I apply for a job?", a: "Browse jobs, find a position you're interested in, click 'View Details', then hit 'Apply Now'. Make sure your profile is complete before applying." },
  { q: "Can I switch between job seeker and recruiter modes?", a: "Yes! If you've enabled both roles in your profile settings, you can toggle between 'Job Seeker' and 'Recruiter' modes using the switch in the navigation bar." },
  { q: "How do I save a job for later?", a: "Click the bookmark icon on any job card or job details page. Access your saved jobs anytime from the 'Saved Jobs' section in your profile menu." },
  { q: "How do recruiters verify their accounts?", a: "Recruiters need to complete their company profile and submit verification documents. Our team reviews and verifies within 24-48 hours." },
  { q: "What file formats are accepted for resumes?", a: "We accept PDF and DOC/DOCX formats. Maximum file size is 5MB. Make sure your resume is ATS-friendly for best results." },
  { q: "How do I track my application status?", a: "Go to your Profile and click on 'Applied Jobs'. You'll see the current status of each application (Applied, Reviewed, Interviewing, etc.)." },
  { q: "Is my data secure?", a: "Absolutely. We use industry-standard encryption, secure authentication, and follow data protection best practices. Your data is never shared without your consent." },
];

const categories = [
  { icon: FileText, title: "Getting Started", desc: "New to JobPilot Ai? Start here", articles: "12 articles" },
  { icon: MessageCircle, title: "Account & Profile", desc: "Manage your account settings", articles: "8 articles" },
  { icon: HelpCircle, title: "Job Applications", desc: "Everything about applying", articles: "15 articles" },
  { icon: Mail, title: "Recruiter Tools", desc: "For employers and recruiters", articles: "10 articles" },
];

const contactOptions = [
  { icon: Mail, title: "Email Support", desc: "We respond within 24 hours", action: "goswamidarshan12345@gmail.com" },
  { icon: MessageCircle, title: "Live Chat", desc: "Available 9 AM - 6 PM IST", action: "Start Chat" },
  { icon: Phone, title: "Phone Support", desc: "Mon-Fri, 9 AM - 5 PM", action: "+91 8865928963" },
];

export default function HelpCenter() {
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  const filteredFaqs = faqs.filter(
    (f) => !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />
      <PageHero
        badge="We're Here to Help"
        title="Help Center"
        subtitle="Find answers to common questions or get in touch with our support team."
        gradient="from-gray-700 via-gray-800 to-gray-900"
      >
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for answers..."
            className="w-full h-12 pl-12 pr-4 rounded-xl border-0 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-lg text-sm"
          />
        </div>
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-5 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                <cat.icon className="h-5 w-5 text-[#0A66C2]" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{cat.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{cat.desc}</p>
              <span className="text-xs text-[#0A66C2] dark:text-blue-400 font-medium mt-2 inline-block">{cat.articles} →</span>
            </motion.div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {filteredFaqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-white pr-4">{faq.q}</span>
                  <ChevronDown className={cn("h-5 w-5 text-gray-400 shrink-0 transition-transform", openFaq === i && "rotate-180")} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 pt-0 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">{faq.a}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Contact Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contactOptions.map((opt, i) => (
              <motion.div
                key={opt.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-5 text-center hover:shadow-lg transition-all"
              >
                <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
                  <opt.icon className="h-5 w-5 text-[#0A66C2]" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{opt.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">{opt.desc}</p>
                <span className="text-xs font-medium text-[#0A66C2] dark:text-blue-400">{opt.action}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <CTABanner
        title="Still Have Questions?"
        subtitle="Our support team is ready to help you with any questions or concerns."
        buttonText="Contact Support"
        buttonLink="/contact"
        gradient="from-gray-700 via-gray-800 to-gray-900"
      />
    </div>
  );
}
