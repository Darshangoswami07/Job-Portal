import { motion } from "framer-motion"

export default function ProfileAvatar() {
  return (
    <div className="flex justify-center mb-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 200, 
          damping: 20, 
          delay: 0.15 
        }}
        className="relative"
      >
        {/* Outer ambient glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#0A66C2]/20 via-[#2563EB]/15 to-[#0A66C2]/8 blur-3xl" />
        
        {/* Glassmorphism decorative ring */}
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute inset-[-4px] rounded-full border border-[#0A66C2]/10"
        />
        
        {/* Subtle floating decorative elements */}
        <motion.div
          animate={{ 
            y: [0, -6, 0],
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute -top-4 -right-6 w-4 h-4 rounded-full bg-gradient-to-br from-[#0A66C2]/30 to-[#2563EB]/20"
        />
        <motion.div
          animate={{ 
            y: [0, 5, 0],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.15, 1]
          }}
          transition={{ 
            duration: 3.5, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 0.7
          }}
          className="absolute -bottom-3 -left-8 w-3 h-3 rounded-full bg-gradient-to-br from-[#2563EB]/25 to-[#0A66C2]/15"
        />
        <motion.div
          animate={{ 
            y: [0, -4, 0],
            opacity: [0.25, 0.45, 0.25],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 4.5, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1.2
          }}
          className="absolute top-1/3 -right-10 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#0A66C2]/20 to-[#2563EB]/10"
        />
        <motion.div
          animate={{ 
            y: [0, 3, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-1/4 -left-12 w-2.5 h-2.5 rounded-full bg-[#2563EB]/15"
        />
        
        {/* Main avatar container */}
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#0A66C2] to-[#2563EB] p-[3px] shadow-2xl shadow-blue-500/30">
          {/* Glassmorphism inner background */}
          <div className="w-full h-full rounded-full bg-gradient-to-br from-white via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center overflow-hidden relative backdrop-blur-sm">
            
            {/* Premium inner shadow */}
            <div className="absolute inset-0 rounded-full shadow-inner bg-gradient-to-br from-transparent via-black/[0.02] to-black/[0.05] dark:to-white/[0.02]" />
            
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#0A66C2]/5 via-transparent to-[#2563EB]/5" />
            
            {/* Premium user illustration */}
            <svg
              viewBox="0 0 96 96"
              className="w-16 h-16 relative z-10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="authGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0A66C2" />
                  <stop offset="40%" stopColor="#1E7AF8" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
                <linearGradient id="softGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0A66C2" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.06" />
                </linearGradient>
                <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0A66C2" floodOpacity="0.15"/>
                </filter>
              </defs>
              
              {/* Background glow */}
              <circle cx="48" cy="48" r="44" fill="url(#softGrad)" />
              
              {/* User silhouette with soft shadow */}
              <g transform="translate(24, 22)" filter="url(#softShadow)">
                {/* Head */}
                <circle 
                  cx="24" 
                  cy="18" 
                  r="14" 
                  fill="url(#authGrad)"
                />
                
                {/* Body/Shoulders */}
                <path 
                  d="M4 52C4 38 12 32 24 32C36 32 44 38 44 52V56H4V52Z"
                  fill="url(#authGrad)"
                />
              </g>
            </svg>
          </div>
        </div>
        
        {/* Decorative thin rings */}
        <div className="absolute inset-0 rounded-full border border-[#0A66C2]/15" />
        <div className="absolute inset-2 rounded-full border border-[#0A66C2]/8" />
        <div className="absolute inset-4 rounded-full border border-[#0A66C2]/5" />
        
        {/* Additional ambient glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#2563EB]/10 via-transparent to-[#0A66C2]/5 blur-xl" />
      </motion.div>
    </div>
  )
}