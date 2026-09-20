import { motion } from "framer-motion";
import { FileText, Scale, AlertCircle, UserCheck, Ban, Gavel } from "lucide-react";
import Navbar from "@/components/shared/Navbar";

const sections = [
  {
    icon: FileText,
    title: "1. Acceptance of Terms",
    content: "By accessing or using JobPilot Ai, you agree to be bound by these Terms of Service. If you do not agree to all the terms, you may not access or use our services. These terms apply to all visitors, users, and others who access or use our platform.",
  },
  {
    icon: UserCheck,
    title: "2. User Accounts",
    content: "You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately of any unauthorized use of your account. You must be at least 18 years old to create an account. One person may not maintain multiple accounts without authorization.",
  },
  {
    icon: Scale,
    title: "3. User Responsibilities",
    content: "You agree to provide accurate, current, and complete information during registration. You are responsible for all content you post, including resumes, profile information, and job listings. Prohibited activities include posting false information, misrepresenting your identity, and using the platform for unauthorized commercial purposes.",
  },
  {
    icon: AlertCircle,
    title: "4. Job Listings & Applications",
    content: "Employers are responsible for the accuracy of their job listings. JobPilot Ai does not guarantee employment or interview opportunities. We reserve the right to remove listings that violate our policies or applicable laws.",
  },
  {
    icon: Ban,
    title: "5. Prohibited Activities",
    content: "Users may not: (a) use the platform for any unlawful purpose; (b) attempt to gain unauthorized access to our systems; (c) interfere with other users' enjoyment of the platform; (d) scrape or collect user data without permission; (e) post malicious content or spam; (f) impersonate any person or entity.",
  },
  {
    icon: Gavel,
    title: "6. Limitation of Liability",
    content: "JobPilot Ai shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the platform. We do not guarantee the accuracy of job listings or the conduct of employers. Our total liability is limited to the amount you have paid us in the past 12 months.",
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />

      <div className="relative overflow-hidden bg-gradient-to-br from-[#0A66C2] via-[#004182] to-[#002244]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <FileText className="h-12 w-12 mx-auto text-blue-200 mb-4" />
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Terms of Service</h1>
            <p className="text-lg text-blue-200">Last updated: July 15, 2026</p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#F3F2EF] dark:from-[#0D1117] to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-8 sm:p-10 mb-8">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
            Welcome to JobPilot Ai. These Terms of Service govern your use of our website, mobile applications, and related services. Please read these terms carefully before using our platform.
          </p>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            By creating an account or using JobPilot Ai, you acknowledge that you have read, understood, and agree to be bound by these terms. We reserve the right to update these terms at any time, and we will notify you of material changes.
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
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Contact</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            For questions about these terms, please contact us at abhiyanshbisht@gmail.com.
          </p>
        </div>
      </div>
    </div>
  );
}
