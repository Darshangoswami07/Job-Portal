import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/pagination";

import Job from "@/components/job/Job";
import { searchJobs } from "@/api/jobsApi";

export default function FeaturedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    // Same real, server-side grouped catalogue the Find Jobs page uses.
    searchJobs({ sort: "newest", limit: 9 })
      .then((res) => {
        if (alive && res.data?.success) setJobs(res.data.jobs || []);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (!loading && jobs.length === 0) return null;

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
            The newest active openings from every connected source
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-56 rounded-xl border border-gray-100 bg-gray-50 animate-pulse" />
            ))}
          </div>
        ) : (
          <Swiper
            modules={[Autoplay, Pagination]}
            autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
            pagination={{ clickable: true, dynamicBullets: true }}
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
            {jobs.map((job) => (
              <SwiperSlide key={job._id} className="h-auto">
                <Job job={job} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </motion.section>
  );
}
