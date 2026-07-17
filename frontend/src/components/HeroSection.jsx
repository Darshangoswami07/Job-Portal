import { motion } from "framer-motion"
import { Search, MapPin, Building2, Users, Briefcase, TrendingUp, ArrowRight } from "lucide-react"
import { useState } from "react"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"

import { setSearchQuery } from "@/store/slices/jobSlice"
import AnimatedCounter from "@/components/shared/AnimatedCounter"

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
}

const fadeRight = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
}

const trustCompanies = [
  { name: "Google", color: "#4285F4" },
  { name: "Microsoft", color: "#00A4EF" },
  { name: "Amazon", color: "#FF9900" },
  { name: "Spotify", color: "#1DB954" },
  { name: "Netflix", color: "#E50914" },
]

const jobCards = [
  { id: 0, company: "Google", role: "Senior React Dev", color: "#4285F4", top: "8%", left: "-10%", floatY: 7 },
  { id: 1, company: "Microsoft", role: "Product Manager", color: "#00A4EF", top: "1%", right: "-6%", floatY: 8 },
  { id: 2, company: "Amazon", role: "Backend Engineer", color: "#FF9900", bottom: "12%", left: "8%", floatY: 6 },
  { id: 3, company: "Spotify", role: "UX Designer", color: "#1DB954", bottom: "0%", right: "-2%", floatY: 9 },
]

export default function HeroSection() {
  const [query, setQuery] = useState("")
  const [location, setLocation] = useState("")
  const [focusField, setFocusField] = useState(null)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const searchJobHandler = () => {
    const final = [query, location].filter(Boolean).join(" ")
    dispatch(setSearchQuery(final))
    navigate("/browse")
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#F6F9FC] via-white to-white">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-indigo-400/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-400/3 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 md:pb-20 pt-0">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.div
            className="max-w-xl"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-1.5 text-sm font-medium text-blue-700 mb-6"
            >
              <TrendingUp className="h-4 w-4" />
              <span>12,000+ active jobs waiting for you</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl leading-[1.1]"
            >
              Find Your{" "}
              <span className="bg-gradient-to-r from-[#0A66C2] to-[#2563EB] bg-clip-text text-transparent">
                Dream Job
              </span>{" "}
              Today
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-5 text-lg text-gray-500 leading-relaxed max-w-lg"
            >
              Discover thousands of verified opportunities from the world's top companies. Your next career move starts here.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch"
            >
              <div className="flex flex-1 items-center gap-2 rounded-xl border bg-white/80 backdrop-blur-sm px-4 py-3 transition-all duration-200 shadow-sm hover:shadow-md focus-within:shadow-[0_0_0_3px_rgba(10,102,194,0.15)] focus-within:border-[#0A66C2]"
                style={{
                  borderColor: focusField === "title" ? "#0A66C2" : undefined,
                }}
              >
                <Search className="h-5 w-5 shrink-0 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchJobHandler()}
                  placeholder="Search by job title..."
                  onFocus={() => setFocusField("title")}
                  onBlur={() => setFocusField(null)}
                  className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                />
              </div>
              <div className="flex flex-1 items-center gap-2 rounded-xl border bg-white/80 backdrop-blur-sm px-4 py-3 transition-all duration-200 shadow-sm hover:shadow-md focus-within:shadow-[0_0_0_3px_rgba(10,102,194,0.15)] focus-within:border-[#0A66C2]"
                style={{
                  borderColor: focusField === "location" ? "#0A66C2" : undefined,
                }}
              >
                <MapPin className="h-5 w-5 shrink-0 text-gray-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchJobHandler()}
                  placeholder="Search by location..."
                  onFocus={() => setFocusField("location")}
                  onBlur={() => setFocusField(null)}
                  className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                />
              </div>
              <motion.button
                onClick={searchJobHandler}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0A66C2] to-[#2563EB] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-shadow"
              >
                <Search className="h-4 w-4" />
                Search
              </motion.button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-6 flex flex-wrap gap-3"
            >
              <motion.button
                variants={scaleIn}
                onClick={() => navigate("/browse")}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0A66C2] to-[#2563EB] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-shadow"
              >
                Find Jobs
                <ArrowRight className="h-4 w-4" />
              </motion.button>
              <motion.button
                variants={scaleIn}
                onClick={() => navigate("/admin/jobs")}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:shadow-md hover:border-gray-400 transition-all"
              >
                <Building2 className="h-4 w-4" />
                Post a Job
              </motion.button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-10 pt-8 border-t border-gray-100"
            >
              <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">
                Trusted by industry leaders
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {trustCompanies.map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center gap-2 group cursor-default"
                  >
                    <div
                      className="h-6 w-6 rounded-md flex items-center justify-center text-[11px] font-bold transition-all duration-300"
                      style={{
                        backgroundColor: "#F3F4F6",
                        color: "#9CA3AF",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${c.color}15`
                        e.currentTarget.style.color = c.color
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#F3F4F6"
                        e.currentTarget.style.color = "#9CA3AF"
                      }}
                    >
                      {c.name[0]}
                    </div>
                    <span
                      className="text-sm font-semibold text-gray-400 group-hover:text-gray-600 transition-colors duration-300"
                    >
                      {c.name}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-10 grid grid-cols-3 gap-6 pt-8 border-t border-gray-100"
            >
              <div className="text-center">
                <Briefcase className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                <AnimatedCounter end={12000} suffix="+" label="Active Jobs" />
              </div>
              <div className="text-center">
                <Building2 className="h-5 w-5 text-indigo-600 mx-auto mb-2" />
                <AnimatedCounter end={500} suffix="+" label="Companies" />
              </div>
              <div className="text-center">
                <Users className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
                <AnimatedCounter end={25000} suffix="+" label="Placements" />
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            variants={fadeRight}
            initial="hidden"
            animate="visible"
            className="hidden lg:block"
          >
            <div className="relative flex aspect-[4/3] w-full items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-white border border-blue-100/50 shadow-xl shadow-blue-100/30" />
              <svg
                viewBox="0 0 440 330"
                className="relative h-full w-full p-5"
                fill="none"
              >
                <defs>
                  <linearGradient id="dashGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0A66C2" stopOpacity="0.06" />
                    <stop offset="100%" stopColor="#0A66C2" stopOpacity="0.01" />
                  </linearGradient>
                  <linearGradient id="barGrad1" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#0A66C2" />
                    <stop offset="100%" stopColor="#2563EB" />
                  </linearGradient>
                  <linearGradient id="barGrad2" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#818CF8" />
                  </linearGradient>
                  <linearGradient id="barGrad3" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#34D399" />
                  </linearGradient>
                  <linearGradient id="barGrad4" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#D97706" />
                    <stop offset="100%" stopColor="#FBBF24" />
                  </linearGradient>
                  <filter id="dashShadow">
                    <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#0A66C210" />
                  </filter>
                </defs>

                <rect x="30" y="25" width="380" height="280" rx="16" fill="white" stroke="#E5E7EB" strokeWidth="1.5" filter="url(#dashShadow)" />

                <rect x="30" y="25" width="380" height="44" rx="16" fill="#F9FAFB" />
                <rect x="30" y="53" width="380" height="16" fill="#F9FAFB" />

                <circle cx="58" cy="47" r="10" className="fill-[#0A66C2]/10" stroke="#0A66C2" strokeWidth="1.5" />
                <path d="M54 47l2.5 2.5 4.5-4.5" stroke="#0A66C2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

                <text x="78" y="51" className="fill-gray-900" fontSize="11" fontWeight="700">Dashboard</text>

                <rect x="160" y="36" width="60" height="18" rx="6" className="fill-blue-50" stroke="#0A66C2" strokeWidth="0.5" />
                <text x="190" y="49" textAnchor="middle" className="fill-[#0A66C2]" fontSize="8" fontWeight="600">Overview</text>
                <rect x="228" y="36" width="48" height="18" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="0.5" />
                <text x="252" y="49" textAnchor="middle" className="fill-gray-500" fontSize="8" fontWeight="500">Analytics</text>
                <rect x="284" y="36" width="48" height="18" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="0.5" />
                <text x="308" y="49" textAnchor="middle" className="fill-gray-500" fontSize="8" fontWeight="500">Candidates</text>

                <circle cx="388" cy="47" r="8" className="fill-gray-200" />
                <circle cx="388" cy="44" r="3" className="fill-gray-300" />
                <path d="M382 51c0-3 3-4 6-4s6 1 6 4" className="fill-gray-300" />

                <rect x="50" y="84" width="148" height="52" rx="10" className="fill-blue-50" stroke="#0A66C2" strokeOpacity="0.2" strokeWidth="1" />
                <rect x="60" y="96" width="20" height="20" rx="4" className="fill-[#0A66C2]/10" />
                <path d="M65 102h10M68 102v-2a1 1 0 011-1h2a1 1 0 011 1v2" stroke="#0A66C2" strokeWidth="1.2" strokeLinecap="round" />
                <text x="90" y="104" className="fill-gray-500" fontSize="8" fontWeight="500">Total Jobs</text>
                <text x="90" y="122" className="fill-gray-900" fontSize="16" fontWeight="800">12.4K</text>

                <rect x="212" y="84" width="148" height="52" rx="10" className="fill-indigo-50" stroke="#6366F1" strokeOpacity="0.2" strokeWidth="1" />
                <rect x="222" y="96" width="20" height="20" rx="4" className="fill-indigo-500/10" />
                <text x="232" y="109" textAnchor="middle" className="fill-indigo-600" fontSize="10" fontWeight="700">+</text>
                <text x="252" y="104" className="fill-gray-500" fontSize="8" fontWeight="500">Applications</text>
                <text x="252" y="122" className="fill-gray-900" fontSize="16" fontWeight="800">2.8K</text>

                <rect x="50" y="148" width="310" height="100" rx="10" fill="#FAFBFC" stroke="#E5E7EB" strokeWidth="1" />

                <text x="65" y="165" className="fill-gray-700" fontSize="9" fontWeight="600">Weekly Applications</text>

                <rect x="65" y="177" width="20" height="48" rx="4" fill="url(#barGrad1)" />

                <rect x="95" y="195" width="20" height="30" rx="4" fill="url(#barGrad2)" />
                <rect x="125" y="185" width="20" height="40" rx="4" fill="url(#barGrad3)" />
                <rect x="155" y="175" width="20" height="50" rx="4" fill="url(#barGrad4)" />

                <rect x="185" y="190" width="20" height="35" rx="4" fill="url(#barGrad1)" />
                <rect x="215" y="180" width="20" height="45" rx="4" fill="url(#barGrad2)" />
                <rect x="245" y="200" width="20" height="25" rx="4" fill="url(#barGrad3)" />

                <text x="75" y="240" className="fill-gray-400" fontSize="6" textAnchor="middle">Mon</text>
                <text x="105" y="240" className="fill-gray-400" fontSize="6" textAnchor="middle">Tue</text>
                <text x="135" y="240" className="fill-gray-400" fontSize="6" textAnchor="middle">Wed</text>
                <text x="165" y="240" className="fill-gray-400" fontSize="6" textAnchor="middle">Thu</text>
                <text x="195" y="240" className="fill-gray-400" fontSize="6" textAnchor="middle">Fri</text>
                <text x="225" y="240" className="fill-gray-400" fontSize="6" textAnchor="middle">Sat</text>
                <text x="255" y="240" className="fill-gray-400" fontSize="6" textAnchor="middle">Sun</text>

                <rect x="282" y="173" width="28" height="12" rx="4" className="fill-emerald-50" stroke="#059669" strokeWidth="0.5" />
                <text x="296" y="182" textAnchor="middle" className="fill-emerald-600" fontSize="6" fontWeight="700">+24%</text>

                <rect x="50" y="258" width="148" height="32" rx="8" fill="white" stroke="#E5E7EB" strokeWidth="1" />
                <rect x="58" y="266" width="18" height="18" rx="4" className="fill-blue-500/10" />
                <text x="67" y="278" textAnchor="middle" className="fill-[#0A66C2]" fontSize="7" fontWeight="700">G</text>
                <text x="84" y="273" className="fill-gray-700" fontSize="8" fontWeight="600">Google Inc.</text>
                <text x="84" y="283" className="fill-gray-400" fontSize="7">12 open positions</text>

                <rect x="212" y="258" width="148" height="32" rx="8" fill="white" stroke="#E5E7EB" strokeWidth="1" />
                <rect x="220" y="266" width="18" height="18" rx="4" className="fill-sky-500/10" />
                <text x="229" y="278" textAnchor="middle" className="fill-sky-600" fontSize="7" fontWeight="700">M</text>
                <text x="246" y="273" className="fill-gray-700" fontSize="8" fontWeight="600">Microsoft</text>
                <text x="246" y="283" className="fill-gray-400" fontSize="7">8 open positions</text>
              </svg>

              {jobCards.map((card) => (
                <motion.div
                  key={card.id}
                  className="absolute w-44 rounded-xl border border-gray-100 bg-white p-3 shadow-xl shadow-gray-200/50 backdrop-blur-sm"
                  style={{
                    top: card.top,
                    left: card.left,
                    right: card.right,
                    bottom: card.bottom,
                  }}
                  animate={{ y: [0, -card.floatY, 0] }}
                  transition={{
                    duration: 4 + card.id * 0.3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: card.id * 0.5,
                  }}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: card.color }}
                    >
                      {card.company[0]}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-gray-900 block truncate leading-tight">
                        {card.company}
                      </span>
                      <span className="text-[10px] text-blue-600 font-medium">● Hiring Now</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-tight truncate pl-[42px]">
                    {card.role}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
