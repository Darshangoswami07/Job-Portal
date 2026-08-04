import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock, Send, ChevronDown, Linkedin, Twitter, Github, MessageCircle, Loader2 } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CONTACT_API_END_POINT } from "@/utils/constant";

const offices = [
  { city: "Bangalore, India", address: "456, MG Road, Indiranagar, Bangalore - 560038", phone: "+91 80 4123 4567", email: "blr@jobhub.com" },
  { city: "San Francisco, USA", address: "123 Market Street, Suite 400, SF, CA 94105", phone: "+1 (415) 555-0123", email: "sf@jobhub.com" },
  { city: "London, UK", address: "71 Queen Victoria Street, London EC4V 4AY", phone: "+44 20 7123 4567", email: "london@jobhub.com" },
];

const socialLinks = [
  { icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/in/darshan-goswami-b09137222/" },
  { icon: Twitter, label: "Twitter", href: "#" },
  { icon: Github, label: "GitHub", href: "https://github.com/Darshangoswami07" },
  { icon: MessageCircle, label: "Discord", href: "#" },
];

const faqs = [
  { q: "How quickly do you respond to inquiries?", a: "We typically respond within 24 hours during business days. For urgent matters, use the live chat option." },
  { q: "Can I schedule a demo?", a: "Absolutely! Fill out the form with 'Demo Request' as the subject, and our team will reach out to schedule a convenient time." },
  { q: "Do you offer enterprise support?", a: "Yes, Enterprise plan customers get priority support with a dedicated account manager and 24/7 phone support." },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [openFaq, setOpenFaq] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(CONTACT_API_END_POINT, form, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message || "Message sent successfully! We'll get back to you within 24 hours.");
        setForm({ name: "", email: "", subject: "", message: "" });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />

      <div className="relative overflow-hidden bg-gradient-to-br from-[#0A66C2] via-[#004182] to-[#002244]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">Get in Touch</h1>
            <p className="text-lg text-blue-200 max-w-2xl mx-auto">Have a question, feedback, or want to partner with us? We'd love to hear from you.</p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#F3F2EF] dark:from-[#0D1117] to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Send Us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full h-11 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full h-11 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="john@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full h-11 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="How can we help?" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message *</label>
                <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required rows={5} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" placeholder="Tell us more about your inquiry..." />
              </div>
              <Button type="submit" disabled={loading} className="w-full btn-primary rounded-xl py-5 font-semibold">
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                {loading ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Email</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">support@jobhub.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Phone</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Headquarters</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">456, MG Road, Indiranagar<br />Bangalore - 560038, India</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Business Hours</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Mon - Fri: 9:00 AM - 6:00 PM IST</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Follow Us</h3>
              <div className="flex gap-3">
                {socialLinks.map((s) => (
                  <a key={s.label} href={s.href} className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-[#0A66C2] hover:text-white transition-all">
                    <s.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Our Offices</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {offices.map((office) => (
                <div key={office.city} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-750 border border-gray-100 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{office.city}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{office.address}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{office.phone}</p>
                  <p className="text-xs text-[#0A66C2] dark:text-blue-400">{office.email}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Quick Answers</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 card-shadow overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                  <span className="text-sm font-medium text-gray-900 dark:text-white pr-4">{faq.q}</span>
                  <ChevronDown className={cn("h-5 w-5 text-gray-400 shrink-0 transition-transform", openFaq === i && "rotate-180")} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 pt-0 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
