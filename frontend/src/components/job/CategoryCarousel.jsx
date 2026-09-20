import { useNavigate } from "react-router-dom"

import useCatalogStats from "@/hooks/useCatalogStats"

const StatTile = ({ value, label, loading }) => (
  <div className="text-center">
    {loading ? (
      <div className="mx-auto h-8 w-16 rounded bg-gray-200 animate-pulse" />
    ) : (
      <p className="text-3xl font-bold text-gray-900">{value?.toLocaleString?.() ?? value}</p>
    )}
    <p className="text-sm text-gray-500 mt-1">{label}</p>
  </div>
)

export default function CategoryCarousel() {
  const navigate = useNavigate()
  const { stats, topCategories, loading } = useCatalogStats()

  const goToCategory = (name) => navigate(`/jobs?q=${encodeURIComponent(name)}`)

  // Only render categories that genuinely have active jobs behind them.
  const categories = topCategories.filter((c) => c.name && c.count > 0)

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900">Popular Categories</h2>
          <p className="text-gray-500 mt-2 max-w-xl mx-auto">
            Explore the roles most represented in the live catalogue
          </p>
        </div>

        {loading ? (
          <div className="flex flex-wrap justify-center gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 w-36 rounded-full bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => goToCategory(cat.name)}
                className="px-5 py-2.5 rounded-full bg-gray-100 text-gray-700 text-sm font-medium hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                {cat.name}
                <span className="ml-2 text-xs text-gray-400">{cat.count}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-gray-400">Categories will appear as the catalogue grows.</p>
        )}

        <div className="mt-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            <StatTile loading={loading} value={stats?.activeJobGroups} label="Active Jobs" />
            <StatTile loading={loading} value={stats?.companies} label="Companies" />
            <StatTile loading={loading} value={stats?.locations} label="Locations" />
            <StatTile loading={loading} value={stats?.sources} label="Live Sources" />
          </div>
        </div>
      </div>
    </section>
  )
}
