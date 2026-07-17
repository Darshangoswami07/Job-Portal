import { motion } from "framer-motion"
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/pagination";

import Job from "@/components/job/Job";

const featuredJobs = [
  {
    _id: "featured-1",
    title: "Senior Frontend Engineer",
    description:
      "Build and maintain high-quality web applications using React and modern frontend technologies. Collaborate with cross-functional teams to deliver exceptional user experiences.",
    position: 2,
    jobType: "Full-time",
    salary: "35",
    location: "San Francisco, CA",
    createdAt: "2025-01-10",
    company: { name: "Google", logo: "" },
  },
  {
    _id: "featured-2",
    title: "Product Designer",
    description:
      "Design intuitive and beautiful product experiences. Work closely with engineers and product managers to define and implement innovative solutions.",
    position: 1,
    jobType: "Full-time",
    salary: "28",
    location: "New York, NY",
    createdAt: "2025-01-08",
    company: { name: "Microsoft", logo: "" },
  },
  {
    _id: "featured-3",
    title: "DevOps Engineer",
    description:
      "Manage and scale cloud infrastructure, automate deployments, and ensure high availability of production systems across multiple regions.",
    position: 3,
    jobType: "Full-time",
    salary: "32",
    location: "Seattle, WA",
    createdAt: "2025-01-05",
    company: { name: "Amazon", logo: "" },
  },
  {
    _id: "featured-4",
    title: "Data Engineer",
    description:
      "Design and build data pipelines, optimize data warehousing solutions, and enable data-driven decision making across the organization.",
    position: 2,
    jobType: "Full-time",
    salary: "30",
    location: "Los Gatos, CA",
    createdAt: "2025-01-03",
    company: { name: "Netflix", logo: "" },
  },
  {
    _id: "featured-5",
    title: "iOS Developer",
    description:
      "Develop cutting-edge iOS applications with Swift and SwiftUI. Contribute to the full mobile development lifecycle from concept to delivery.",
    position: 1,
    jobType: "Full-time",
    salary: "33",
    location: "Cupertino, CA",
    createdAt: "2024-12-28",
    company: { name: "Apple", logo: "" },
  },
  {
    _id: "featured-6",
    title: "Machine Learning Engineer",
    description:
      "Build and deploy machine learning models at scale. Work on recommendation systems, natural language processing, and computer vision problems.",
    position: 2,
    jobType: "Full-time",
    salary: "38",
    location: "Menlo Park, CA",
    createdAt: "2024-12-20",
    company: { name: "Meta", logo: "" },
  },
];

export default function FeaturedJobs() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="py-12 px-4 bg-white"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl font-bold text-gray-900">Featured Jobs</h2>
          <p className="text-gray-500 mt-2 max-w-xl mx-auto">
            Hand-picked opportunities from top companies
          </p>
        </motion.div>

        <Swiper
          modules={[Autoplay, Pagination]}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          centeredSlides={true}
          grabCursor={true}
          spaceBetween={24}
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: 1.5, spaceBetween: 20 },
            768: { slidesPerView: 2, spaceBetween: 24 },
            1024: { slidesPerView: 3, spaceBetween: 30 },
          }}
          className="pb-12 [&_.swiper-slide]:transition-all [&_.swiper-slide]:duration-300 [&_.swiper-slide-active]:scale-[1.02] [&_.swiper-pagination-bullet-active]:bg-blue-600"
        >
          {featuredJobs.map((job) => (
            <SwiperSlide key={job._id} className="h-auto">
              <Job job={job} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </motion.section>
  );
}
