import { motion } from "framer-motion";
import { Shield, Lock, Eye, Database, Cookie, Mail } from "lucide-react";
import Navbar from "@/components/shared/Navbar";

const sections = [
  {
    icon: Shield,
    title: "Information We Collect",
    content: "We collect information you provide directly, such as your name, email address, phone number, resume, and profile information. We also automatically collect certain technical information when you use our platform, including IP address, browser type, device information, and usage patterns.",
  },
  {
    icon: Lock,
    title: "How We Use Your Information",
    content: "Your information is used to provide and improve our services, match you with job opportunities, communicate with you about your account, send relevant job alerts, and personalize your experience. We do not sell your personal information to third parties.",
  },
  {
    icon: Eye,
    title: "Data Sharing & Disclosure",
    content: "We share your information with employers when you apply for jobs, with service providers who help us operate our platform, and as required by law. You control what information is visible on your public profile.",
  },
  {
    icon: Database,
    title: "Data Storage & Security",
    content: "Your data is stored on secure servers with encryption at rest and in transit. We implement industry-standard security measures including SSL/TLS encryption, regular security audits, and access controls to protect your information.",
  },
  {
    icon: Cookie,
    title: "Cookies & Tracking",
    content: "We use cookies and similar technologies to enhance your experience, analyze usage, and serve relevant job recommendations. You can manage cookie preferences through your browser settings.",
  },
  {
    icon: Mail,
    title: "Contact Us",
    content: "If you have questions about this privacy policy or your data rights, please contact us at goswamidarshan12345@gmail.com.",
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />

      <div className="relative overflow-hidden bg-gradient-to-br from-[#0A66C2] via-[#004182] to-[#002244]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <Shield className="h-12 w-12 mx-auto text-blue-200 mb-4" />
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
            <p className="text-lg text-blue-200">Last updated: July 15, 2026</p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#F3F2EF] dark:from-[#0D1117] to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-8 sm:p-10 mb-8">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
            At JobPilot Ai, we take your privacy seriously. This policy describes how we collect, use, and protect your personal information when you use our platform and services.
          </p>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            By using JobPilot Ai, you agree to the collection and use of information in accordance with this policy. If you do not agree with any part of this policy, please do not use our services.
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6 sm:p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{s.title}</h2>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{s.content}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 p-6 sm:p-8 mt-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Your Rights</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            You have the right to access, update, or delete your personal data at any time. You can manage your privacy settings from your profile page. For any data-related requests, contact us at goswamidarshan12345@gmail.com. We will respond to your request within 30 days.
          </p>
        </div>
      </div>
    </div>
  );
}
