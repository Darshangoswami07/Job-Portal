import { motion } from "framer-motion";
import { Linkedin, Github, Globe, Mail, Twitter, Award, Brain, Code, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const socialIcons = {
  linkedin: { icon: Linkedin, href: "linkedInUrl", label: "LinkedIn" },
  github: { icon: Github, href: "githubUrl", label: "GitHub" },
  portfolio: { icon: Globe, href: "portfolioUrl", label: "Portfolio" },
  twitter: { icon: Twitter, href: "twitterUrl", label: "Twitter" },
  email: { icon: Mail, href: "email", label: "Email" },
};

const founderStats = [
  { label: "Years Exp.", value: "5+", icon: Award },
  { label: "AI Apps", value: "20+", icon: Brain },
  { label: "Technologies", value: "15+", icon: Code },
];

export default function FounderCard({ founder }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="group relative"
    >
      <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-xl transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-400/30">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
            <div className="relative shrink-0">
              <div className={cn(
                "h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                founder.avatarColor || "from-blue-500 to-cyan-500"
              )}>
                <span className="text-3xl sm:text-4xl font-bold text-white">{founder.avatarInitials}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                <div className="h-2.5 w-2.5 rounded-full bg-white" />
              </div>
            </div>

            <div className="text-center sm:text-left flex-1 min-w-0">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {founder.name}
              </h3>
              <p className="text-base font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                {founder.position}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {founder.role}
              </p>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 text-sm sm:text-base">
            {founder.bio}
          </p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {founderStats.map((stat) => {
              const StatIcon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-blue-50/80 to-purple-50/80 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100/50 dark:border-gray-700/30"
                >
                  <StatIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</span>
                  <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {founder.skills?.slice(0, 6).map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/50 hover:shadow-md transition-shadow text-xs px-3 py-1"
              >
                {skill}
              </Badge>
            ))}
            {founder.skills?.length > 6 && (
              <Badge variant="outline" className="text-gray-400 dark:text-gray-500 border-dashed text-xs">
                +{founder.skills.length - 6}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-0 shadow-md text-xs px-3 py-1">
              <Award className="h-3 w-3 mr-1" />
              Full Stack
            </Badge>
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0 shadow-md text-xs px-3 py-1">
              <Brain className="h-3 w-3 mr-1" />
              AI/ML
            </Badge>
            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-md text-xs px-3 py-1">
              <Code className="h-3 w-3 mr-1" />
              {founder.position.includes("CTO") ? "Engineering" : "Leadership"}
            </Badge>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center justify-center sm:justify-start gap-4">
              {Object.entries(socialIcons).map(([key, { icon: Icon, href, label }]) => {
                const url = founder[href];
                if (!url) return null;
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 group/icon"
                    title={label}
                  >
                    <Icon className="h-4 w-4 transition-transform group-hover/icon:scale-110" />
                    <span className="text-xs font-medium hidden sm:inline">{label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}