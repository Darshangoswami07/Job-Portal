import { motion } from "framer-motion"

import Navbar from "@/components/shared/Navbar"
import HeroSection from "@/components/HeroSection"
import CategoryCarousel from "@/components/job/CategoryCarousel"
import PopularCompanies from "@/components/job/PopularCompanies"
import FeaturedJobs from "@/components/job/FeaturedJobs"
import LatestJobs from "@/components/job/LatestJobs"
import Testimonials from "@/components/job/Testimonials"
import Footer from "@/components/shared/Footer"
import useGetAllJobs from "@/hooks/useGetAllJobs"

export default function Home() {
  useGetAllJobs()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[#F3F2EF]"
    >
      <Navbar />
      <HeroSection />
      <CategoryCarousel />
      <PopularCompanies />
      <FeaturedJobs />
      <LatestJobs />
      <Testimonials />
      <Footer />
    </motion.div>
  )
}
