import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

const trustCompanies = [
  { name: "Google", color: "#4285F4" },
  { name: "Microsoft", color: "#00A4EF" },
  { name: "Amazon", color: "#FF9900" },
  { name: "Meta", color: "#1877F2" },
  { name: "Adobe", color: "#FF0000" },
]

const floatingCards = [
  { id: 0, initials: "S", name: "Sarah", company: "Google", color: "#4285F4", top: "14%", left: "8%", delay: 0 },
  { id: 1, initials: "J", name: "James", company: "Microsoft", color: "#00A4EF", top: "38%", right: "6%", delay: 1.5 },
  { id: 2, initials: "P", name: "Priya", company: "Amazon", color: "#FF9900", bottom: "22%", left: "4%", delay: 3 },
  { id: 3, initials: "A", name: "Alex", company: "Meta", color: "#1877F2", top: "58%", right: "4%", delay: 0.8 },
]

const notifications = [
  { icon: "🎉", text: "Sarah got hired at Google" },
  { icon: "💼", text: "New React Developer job added" },
  { icon: "🔥", text: "Amazon is hiring Backend Engineers" },
]

const dashboardCards = [
  { label: "Total Jobs", value: "12.4K", x: 55, y: 130, color: "#0A66C2" },
  { label: "Applicants", value: "2.8K", x: 210, y: 130, color: "#6366F1" },
]

export default function AuthLayout({ children }) {
  const [currentNotif, setCurrentNotif] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNotif((prev) => (prev + 1) % notifications.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate("/")
    }
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#0D1117]">
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-[#F0F6FF] via-[#E8F0FE] to-[#F6F9FC] dark:from-[#0D1117] dark:via-[#161B22] dark:to-[#0D1117]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl" />
          <div className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-indigo-400/4 blur-3xl" />
          <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-blue-400/5 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(circle, #0A66C2 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
        </div>

        {/* Back Button - Top Left Corner */}
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          onClick={handleBack}
          className="absolute top-8 left-8 z-20 group flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 active:scale-[0.98]"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span className="transition-colors duration-200">Back</span>
        </motion.button>

        <div className="relative flex flex-col justify-center px-14 w-full">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center gap-2.5 mb-10"
          >
            <img src="/logo.png" alt="JobPilot Ai" className="size-12 object-contain" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">JobPilot Ai</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl font-bold text-gray-900 dark:text-white leading-tight"
          >
            Build Your Career
            <br />
            <span className="text-[#0A66C2] dark:text-[#2F81F7]">With Confidence</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-3.5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm"
          >
            Join thousands of professionals discovering opportunities from the world&apos;s best companies.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8"
          >
            <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-[0.12em] mb-3">
              Trusted by
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {trustCompanies.map((c) => (
                <div key={c.name} className="flex items-center gap-1.5 group cursor-default">
                  <div
                    className="h-5 w-5 rounded flex items-center justify-center text-[9px] font-bold transition-all duration-300"
                    style={{ backgroundColor: "#F3F4F6", color: "#9CA3AF" }}
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
                  <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300">
                    {c.name}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8"
          >
            <svg viewBox="0 0 300 120" className="w-full max-w-xs" fill="none">
              <rect x="0" y="0" width="300" height="120" rx="10" fill="white" className="dark:fill-[#21262D] dark:stroke-[#30363D]" stroke="#E5E7EB" strokeWidth="1" />
              <rect x="14" y="10" width="50" height="14" rx="4" className="fill-blue-500/10 dark:fill-blue-500/15" />
              <rect x="14" y="24" width="40" height="6" rx="3" className="fill-gray-300 dark:fill-gray-600" />
              {dashboardCards.map((card, i) => (
                <g key={i}>
                  <rect x={card.x} y="10" width="50" height="38" rx="6" className="fill-blue-50 dark:fill-blue-900/20" />
                  <text x={card.x + 6} y="24" className="fill-gray-400 dark:fill-gray-500" fontSize="6" fontWeight="500">{card.label}</text>
                  <text x={card.x + 6} y="40" className="fill-gray-900 dark:fill-gray-100" fontSize="13" fontWeight="700">{card.value}</text>
                </g>
              ))}
              <rect x="14" y="56" width="272" height="8" rx="4" className="fill-gray-100 dark:fill-gray-800" />
              <rect x="14" y="56" width="180" height="8" rx="4" className="fill-blue-500/40 dark:fill-blue-400/30" />
              <rect x="14" y="72" width="50" height="36" rx="4" className="fill-green-50 dark:fill-green-900/20" stroke="#059669" strokeOpacity="0.3" strokeWidth="0.5" />
              <text x="39" y="91" textAnchor="middle" className="fill-green-600 dark:fill-green-400" fontSize="14" fontWeight="700">+24%</text>
              <rect x="74" y="72" width="100" height="16" rx="4" className="fill-gray-100 dark:fill-gray-800" />
              <text x="124" y="84" textAnchor="middle" className="fill-gray-500 dark:fill-gray-400" fontSize="7">Hiring activity</text>
              <circle cx="88" cy="90" r="10" className="fill-blue-500/10 dark:fill-blue-500/20" />
              <path d="M84 90l2.5 2.5 4.5-4.5" stroke="#0A66C2" className="dark:stroke-[#2F81F7]" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="110" y="94" width="40" height="4" rx="2" className="fill-gray-200 dark:fill-gray-700" />
              <rect x="160" y="94" width="30" height="4" rx="2" className="fill-gray-200 dark:fill-gray-700" />
              <rect x="200" y="72" width="86" height="36" rx="6" fill="white" className="dark:fill-[#161B22] dark:stroke-[#30363D]" stroke="#E5E7EB" strokeWidth="0.5" />
              <rect x="208" y="80" width="14" height="14" rx="3" className="fill-green-500/20" />
              <text x="215" y="91" textAnchor="middle" className="fill-green-600 dark:fill-green-400" fontSize="7" fontWeight="600">✓</text>
              <text x="230" y="90" className="fill-gray-700 dark:fill-gray-300" fontSize="7" fontWeight="600">Resume uploaded</text>
              <text x="230" y="100" className="fill-gray-400 dark:fill-gray-500" fontSize="6">2 min ago</text>
            </svg>
          </motion.div>
        </div>

        <div className="absolute bottom-6 left-14 right-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentNotif}
              initial={{ opacity: 0, y: 8, x: -8 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -8, x: 8 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="inline-flex items-center gap-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-[#161B22]/90 backdrop-blur-sm px-3.5 py-2.5 shadow-lg"
            >
              <span className="text-base leading-none">{notifications[currentNotif].icon}</span>
              <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                {notifications[currentNotif].text}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {floatingCards.map((card) => (
          <motion.div
            key={card.id}
            className="absolute w-32 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-[#161B22]/90 p-2 shadow-lg backdrop-blur-sm"
            style={{ top: card.top, left: card.left, right: card.right, bottom: card.bottom }}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: card.delay }}
          >
            <div className="flex items-center gap-2">
              <div
                className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                style={{ backgroundColor: card.color }}
              >
                {card.initials}
              </div>
              <span className="text-[10px] text-gray-600 dark:text-gray-300 font-medium truncate">{card.name}</span>
            </div>
            <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              hired at{" "}
              <span className="font-semibold" style={{ color: card.color }}>
                {card.company}
              </span>
            </p>
          </motion.div>
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 bg-white dark:bg-[#0D1117] relative">
        {/* Mobile Back Button - Top Left */}
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          onClick={handleBack}
          className="lg:hidden absolute top-6 left-4 sm:left-6 z-20 group flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 active:scale-[0.98]"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span className="transition-colors duration-200">Back</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-[460px]"
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}
