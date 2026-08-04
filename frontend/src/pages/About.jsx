import { motion } from "framer-motion";
import { Target, Eye, Heart, Users, Globe, Zap, Quote, ArrowRight, Linkedin, Twitter } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import CTABanner from "@/components/sections/CTABanner";
import FounderCard from "@/components/sections/FounderCard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const stats = [
  { value: "50K+", label: "Active Users" },
  { value: "10K+", label: "Companies" },
  { value: "100K+", label: "Jobs Posted" },
  { value: "95%", label: "Satisfaction Rate" },
];

const values = [
  { icon: Heart, title: "Empathy First", desc: "We understand the job search journey because we've been there. Every feature is built with real user needs in mind." },
  { icon: Zap, title: "Innovation Driven", desc: "We leverage cutting-edge AI and machine learning to give job seekers a competitive edge in their applications." },
  { icon: Users, title: "Community Focused", desc: "We believe in the power of community. Our platform connects job seekers, mentors, and recruiters in meaningful ways." },
  { icon: Globe, title: "Global Reach", desc: "From Bangalore to San Francisco, we help professionals across the globe find opportunities that match their aspirations." },
];

const timeline = [
  { year: "2023", title: "The Beginning", desc: "JobHub was founded with a mission to make job searching smarter, not harder." },
  { year: "2024", title: "AI Integration", desc: "Launched AI-powered resume builder and cover letter generator, helping thousands of users." },
  { year: "2025", title: "Platform Growth", desc: "Reached 50,000 active users and partnered with 10,000+ companies across India and US." },
  { year: "2026", title: "Global Expansion", desc: "Expanded to 20+ countries, launched mobile apps, and introduced enterprise solutions." },
];

const team = [
  { name: "Arun Sharma", role: "CEO & Co-Founder", img: "AS", color: "from-blue-500 to-cyan-500" },
  { name: "Priya Patel", role: "CTO & Co-Founder", img: "PP", color: "from-purple-500 to-pink-500" },
  { name: "Rahul Verma", role: "Head of Product", img: "RV", color: "from-emerald-500 to-teal-500" },
  { name: "Ananya Singh", role: "Head of Design", img: "AS", color: "from-orange-500 to-red-500" },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />

      <div className="relative overflow-hidden bg-gradient-to-br from-[#0A66C2] via-[#004182] to-[#002244]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
              We're on a Mission to
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200">Transform Careers</span>
            </h1>
            <p className="text-lg text-blue-200 max-w-2xl mx-auto">JobHub is building the future of career development — one application at a time.</p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#F3F2EF] dark:from-[#0D1117] to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6 text-center"
            >
              <p className="text-3xl font-bold text-[#0A66C2] dark:text-blue-400">{s.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-8"
          >
            <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Our Mission</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">To empower every professional with AI-driven tools and resources that make job searching efficient, personalized, and successful. We believe the right job can change your life, and the right tools can help you find it.</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-8"
          >
            <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center mb-4">
              <Eye className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Our Vision</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">A world where every professional has equal access to the tools, insights, and opportunities needed to build a fulfilling career — regardless of their background, location, or network.</p>
          </motion.div>
        </div>

        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Our Values</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">The principles that guide everything we build</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6"
                >
                  <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{v.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{v.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Our Journey</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Key milestones that shaped JobHub</p>
          </div>
          <div className="relative">
            <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-0.5 bg-blue-200 dark:bg-blue-800 hidden md:block" />
            <div className="space-y-8">
              {timeline.map((t, i) => (
                <motion.div
                  key={t.year}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className={`relative flex items-center gap-6 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  <div className={`flex-1 ${i % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6 inline-block max-w-md">
                      <span className="text-sm font-bold text-[#0A66C2] dark:text-blue-400">{t.year}</span>
                      <h3 className="font-semibold text-gray-900 dark:text-white mt-1">{t.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.desc}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex h-4 w-4 rounded-full bg-[#0A66C2] border-4 border-white dark:border-gray-900 shrink-0" />
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Meet Our Team</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">The people behind JobHub</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
            <FounderCard founder={{
              name: "Darshan Goswami",
              position: "CTO & Co-Founder",
              role: "Software Engineer • AI/ML Engineer • Full Stack Developer",
              bio: "Darshan Goswami is responsible for the technology, AI systems, backend architecture, and product engineering of JobHub. He specializes in Full Stack Development, Artificial Intelligence, Machine Learning, scalable backend systems, cloud deployment, and modern web technologies. His vision is to build AI-powered career solutions that simplify job searching and career growth for millions of users.",
              skills: ["Artificial Intelligence", "Machine Learning", "Full Stack Development", "React", "Next.js", "FastAPI", "Django", "Node.js", "PostgreSQL", "Docker", "LangChain", "LangGraph", "RAG", "MCP", "Cloud Computing"],
              avatarInitials: "DG",
              avatarColor: "from-blue-500 to-cyan-500",
              linkedInUrl: "https://www.linkedin.com/in/darshan-goswami-b09137222/",
              githubUrl: "https://github.com/Darshangoswami07",
              portfolioUrl: "https://darshangoswami.com",
              email: "darshan@jobhub.com"
            }} />
            <FounderCard founder={{
              name: "Darshan Goswami",
              position: "CEO & Co-Founder",
              role: "Full Stack Developer • Software Engineer • AI/ML Engineer • Product Strategist",
              bio: "Darshan Goswami leads the overall vision, product strategy, business development, and growth of JobHub. He also works as a Full Stack Developer, managing the database, backend, and frontend of the JobHub platform. He works closely on AI-driven innovation, user experience, and building a world-class platform that connects job seekers with the best career opportunities through intelligent automation.",
              skills: ["Artificial Intelligence", "Machine Learning", "Full Stack Development", "React", "Next.js", "Python", "Node.js", "Product Strategy", "Leadership", "Software Engineering", "Business Development", "Product Management", "System Design", "Cloud Computing"],
              avatarInitials: "DG",
              avatarColor: "from-purple-500 to-pink-500",
              linkedInUrl: "https://www.linkedin.com/in/darshan-goswami-b09137222/",
              githubUrl: "https://github.com/Darshangoswami07",
              portfolioUrl: "https://darshangoswami.com",
              email: "darshan@jobhub.com"
            } }/>
          </div>
        </div>
      </div>

      <CTABanner
        title="Ready to Transform Your Career?"
        subtitle="Join 50,000+ professionals who are already using JobHub to advance their careers."
        buttonText="Get Started Free"
        buttonLink="/signup"
        gradient="from-[#0A66C2] via-[#004182] to-[#002244]"
      />
    </div>
  );
}
