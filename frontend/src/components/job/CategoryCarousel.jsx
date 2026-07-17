import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"

import { setSearchQuery } from "@/store/slices/jobSlice"

const categories = [
  { name: "Frontend Developer" },
  { name: "Backend Developer" },
  { name: "Fullstack Developer" },
  { name: "Data Science" },
  { name: "Graphic Designer" },
  { name: "Mobile App Developer" },
  { name: "DevOps Engineer" },
  { name: "Product Manager" },
  { name: "UI/UX Designer" },
  { name: "Cybersecurity Analyst" },
]

export default function CategoryCarousel() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const searchJobHandler = (query) => {
    dispatch(setSearchQuery(query))
    navigate("/browse")
  }

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900">Popular Categories</h2>
          <p className="text-gray-500 mt-2 max-w-xl mx-auto">
            Explore thousands of jobs across top categories
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => searchJobHandler(cat.name)}
              className="px-5 py-2.5 rounded-full bg-gray-100 text-gray-700 text-sm font-medium hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="mt-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">10,000+</p>
              <p className="text-sm text-gray-500 mt-1">Jobs</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">500+</p>
              <p className="text-sm text-gray-500 mt-1">Companies</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">25,000+</p>
              <p className="text-sm text-gray-500 mt-1">Candidates</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">50+</p>
              <p className="text-sm text-gray-500 mt-1">Categories</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
