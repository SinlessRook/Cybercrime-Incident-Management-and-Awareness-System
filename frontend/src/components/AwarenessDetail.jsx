"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { fetchAwarenessDetail } from "../api/awareness"
import { ArrowLeft, Calendar, User } from "lucide-react"

export default function AwarenessDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [resource, setResource] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadResource = async () => {
      try {
        const data = await fetchAwarenessDetail(id)
        setResource(data)
      } catch (err) {
        setError("Failed to load resource.")
      } finally {
        setLoading(false)
      }
    }
    loadResource()
  }, [id])

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
  if (!resource)
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <p className="text-slate-400 text-lg">Article not found.</p>
      </div>
    )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <div className="bg-slate-900/50 border-b border-indigo-500/20 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Articles
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <article className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl shadow-indigo-600/10 backdrop-blur-sm">
          {/* Hero Image */}
          {resource.image && (
            <div className="relative h-96 overflow-hidden bg-gradient-to-br from-indigo-950 to-slate-900">
              <img
                src={resource.image || "/placeholder.svg"}
                alt={resource.title}
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>
            </div>
          )}

          <div className="p-8 md:p-12">
            {/* Category Badge */}
              <div className="mb-6">
                 {Array.isArray(resource.flair) && resource.flair.length > 0 ? (
                        resource.flair.map((f) => (
                          <span
                            key={f.id}
                            className="inline-block text-xs font-semibold text-indigo-400 bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-500/30 mr-2 mb-1"
                          >
                            {f.name}
                          </span>
                        ))
                      ) : resource.flair && resource.flair.name ? (
                        <span className="inline-block text-xs font-semibold text-indigo-400 bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-500/30">
                          {resource.flair.name}
                        </span>
                      ) : null}
              </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-slate-100 mb-6 leading-tight">{resource.title}</h1>

            <div className="flex flex-wrap items-center gap-6 pb-8 border-b border-slate-700/50 mb-8">
              <div className="flex items-center gap-2 text-slate-400">
                <User className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium">By {resource.author}</span>
              </div>
              {resource.created_at && (
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-medium">
                    {new Date(resource.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>

            <div className="prose prose-lg max-w-none">
              <div className="text-slate-300 leading-relaxed text-lg whitespace-pre-wrap">{resource.content}</div>
            </div>
          </div>
        </article>

        <div className="mt-12 text-center">
          <button
            onClick={() => navigate("/awareness")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Articles
          </button>
        </div>
      </div>
    </div>
  )
}
