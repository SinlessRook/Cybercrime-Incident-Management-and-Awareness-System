"use client"

import { useEffect, useState } from "react"
import { fetchAwarenessResources, fetchFlairs } from "../api/awareness"
import { Link, useNavigate } from "react-router-dom"
import { ChevronRight, Plus } from "lucide-react"

export default function AwarenessList() {
  const [resources, setResources] = useState([])
  const [flairs, setFlairs] = useState([])
  const [selectedFlair, setSelectedFlair] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true)
        const [flairData, resourceData] = await Promise.all([fetchFlairs(), fetchAwarenessResources(selectedFlair)])
        setFlairs(flairData)
        setResources(resourceData)
      } catch (err) {
        setError("Failed to fetch data.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [selectedFlair])

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    )
  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <p className="text-red-400 text-lg">{error}</p>
      </div>
    )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <div className="bg-slate-900/50 border-b border-indigo-500/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <h1 className="text-5xl font-bold text-slate-100 mb-3">Cyber Awareness Resources</h1>
          <p className="text-lg text-slate-400">
            Explore curated articles and insights to enhance your cybersecurity knowledge
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <p className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wide">Filter by Category</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedFlair(null)}
              className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                selectedFlair === null
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/40"
                  : "bg-slate-800 text-slate-300 border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-700/50"
              }`}
            >
              All Articles
            </button>
            {flairs.map((flair) => (
              <button
                key={flair.id}
                onClick={() => setSelectedFlair(flair.id === selectedFlair ? null : flair.id)}
                className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                  selectedFlair === flair.id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/40"
                    : "bg-slate-800 text-slate-300 border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-700/50"
                }`}
              >
                {flair.name}
              </button>
            ))}
          </div>
        </div>

        {resources.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg">No articles found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((res) => (
              <Link key={res.id} to={`/awareness/${res.id}`} className="group h-full">
                <div className="h-full bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-600/20 flex flex-col backdrop-blur-sm">
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="mb-4">
                      {Array.isArray(res.flair) && res.flair.length > 0 ? (
                        res.flair.map((f) => (
                          <span
                            key={f.id}
                            className="inline-block text-xs font-semibold text-indigo-400 bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-500/30 mr-2 mb-1"
                          >
                            {f.name}
                          </span>
                        ))
                      ) : res.flair && res.flair.name ? (
                        <span className="inline-block text-xs font-semibold text-indigo-400 bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-500/30">
                          {res.flair.name}
                        </span>
                      ) : null}
                    </div>
                    <h2 className="text-xl font-bold text-slate-100 mb-3 group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {res.title}
                    </h2>
                    <p className="text-slate-400 text-sm mb-4 flex-1 line-clamp-3">{res.synopsis?.slice(0, 120)}...</p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                      <p className="text-xs text-slate-500 font-medium">By {res.author}</p>
                      <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => navigate("/awareness/create")}
        className="fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg shadow-indigo-600/40 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-600/60 hover:scale-110 z-40"
        aria-label="Create new article"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  )
}
