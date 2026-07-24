import { useState, useEffect } from "react";
import { motion as m } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "sonner";
import { ROADMAP_API_END_POINT } from "@/utils/constant";
import Navbar from "@/components/shared/Navbar";
import PageHero from "@/components/sections/PageHero";
import CTABanner from "@/components/sections/CTABanner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, ChevronRight, BookOpen, Target, Clock, TrendingUp, Trash2, ArrowLeft, ExternalLink, Route, Loader2, AlertCircle, Inbox } from "lucide-react";

const categoryBadgeColor = {
  frontend: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  backend: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  datascience: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  devops: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
};

const difficultyColor = {
  beginner: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  intermediate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  advanced: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const categories = [
  { key: "frontend", label: "Frontend Developer" },
  { key: "backend", label: "Backend Developer" },
  { key: "fullstack", label: "Full Stack Developer" },
  { key: "datascience", label: "Data Scientist" },
  { key: "devops", label: "DevOps Engineer" },
];

function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="h-2 bg-gray-200 dark:bg-gray-700" />
      <div className="p-6 space-y-3">
        <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}

export default function CareerRoadmap() {
  const navigate = useNavigate();
  const { user } = useSelector((store) => store.auth);

  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [togglingStep, setTogglingStep] = useState(null);

  const fetchRoadmaps = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(ROADMAP_API_END_POINT, { withCredentials: true });
      setRoadmaps(res.data.data || res.data.roadmaps || []);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
        return;
      }
      setError(err.response?.data?.message || "Failed to fetch roadmaps.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchRoadmaps();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = async (category) => {
    setGenerating(true);
    setShowPicker(false);
    try {
      const res = await axios.post(`${ROADMAP_API_END_POINT}/generate`, { category }, { withCredentials: true });
      toast.success(res.data?.message || "Roadmap created successfully!");
      fetchRoadmaps();
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
        return;
      }
      toast.error(err.response?.data?.message || "Failed to generate roadmap.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await axios.delete(`${ROADMAP_API_END_POINT}/${id}`, { withCredentials: true });
      toast.success(res.data?.message || "Roadmap deleted.");
      if (selectedRoadmap?._id === id) setSelectedRoadmap(null);
      fetchRoadmaps();
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
        return;
      }
      toast.error(err.response?.data?.message || "Failed to delete roadmap.");
    }
  };

  const handleSelectRoadmap = async (id) => {
    setDetailLoading(true);
    setSelectedRoadmap(null);
    try {
      const res = await axios.get(`${ROADMAP_API_END_POINT}/${id}`, { withCredentials: true });
      setSelectedRoadmap(res.data.data || res.data.roadmap || res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
        return;
      }
      toast.error(err.response?.data?.message || "Failed to load roadmap details.");
      setSelectedRoadmap(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleStep = async (stepIndex) => {
    if (!selectedRoadmap) return;
    setTogglingStep(stepIndex);
    try {
      const res = await axios.patch(
        `${ROADMAP_API_END_POINT}/${selectedRoadmap._id}/step`,
        { stepIndex },
        { withCredentials: true }
      );
      const updated = res.data.data || res.data.roadmap || res.data;
      setSelectedRoadmap(updated);
      const listIndex = roadmaps.findIndex((r) => r._id === updated._id);
      if (listIndex !== -1) {
        const updatedList = [...roadmaps];
        updatedList[listIndex] = updated;
        setRoadmaps(updatedList);
      }
      toast.success("Step updated!");
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
        return;
      }
      toast.error(err.response?.data?.message || "Failed to toggle step.");
    } finally {
      setTogglingStep(null);
    }
  };

  if (!user) return null;

  if (selectedRoadmap || detailLoading) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
        <Navbar />
        <PageHero
          badge={selectedRoadmap?.category || "Roadmap"}
          title={selectedRoadmap?.title || "Loading..."}
          subtitle={selectedRoadmap?.description || ""}
          gradient="from-emerald-600 via-teal-700 to-green-900"
        >
          <Button
            onClick={() => setSelectedRoadmap(null)}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10 rounded-xl px-6 py-5 text-base font-semibold"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to List
          </Button>
        </PageHero>

        {detailLoading ? (
          <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-gray-200 dark:bg-gray-700" />
              ))}
            </div>
          </section>
        ) : selectedRoadmap ? (
          <>
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <Badge variant="secondary" className={`capitalize ${categoryBadgeColor[selectedRoadmap.category]}`}>
                  {selectedRoadmap.category}
                </Badge>
                {selectedRoadmap.difficulty && (
                  <Badge variant="secondary" className={`capitalize ${difficultyColor[selectedRoadmap.difficulty]}`}>
                    {selectedRoadmap.difficulty}
                  </Badge>
                )}
                {selectedRoadmap.estimatedDuration && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {selectedRoadmap.estimatedDuration}
                  </Badge>
                )}
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {selectedRoadmap.steps?.length || 0} steps
                </Badge>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 mb-8">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Overall Progress</h3>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{selectedRoadmap.progress || 0}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <m.div
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedRoadmap.progress || 0}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                  />
                </div>
              </div>
            </section>

            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-500" />
                Learning Path
              </h2>

              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

                <div className="space-y-6">
                  {selectedRoadmap.steps?.map((step, index) => {
                    const isCompleted = step.completed;
                    return (
                      <m.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className={`relative pl-14 ${isCompleted ? "opacity-80" : ""}`}
                      >
                        <button
                          onClick={() => handleToggleStep(index)}
                          disabled={togglingStep === index}
                          className="absolute left-2 top-1 p-0.5 rounded-full transition-colors hover:scale-110 disabled:opacity-50"
                        >
                          {isCompleted ? (
                            <CheckCircle className="h-6 w-6 text-emerald-500" />
                          ) : (
                            <Circle className="h-6 w-6 text-gray-300 dark:text-gray-600 hover:text-emerald-400 transition-colors" />
                          )}
                        </button>

                        <div className={`bg-white dark:bg-gray-800 rounded-xl border ${isCompleted ? "border-emerald-200 dark:border-emerald-800" : "border-gray-100 dark:border-gray-700"} p-5 shadow-sm hover:shadow-md transition-all`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                                  Step {step.order || index + 1}
                                </span>
                                {step.duration && (
                                  <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {step.duration}
                                  </span>
                                )}
                              </div>
                              <h3 className={`text-base font-semibold ${isCompleted ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-white"}`}>
                                {step.title}
                              </h3>
                              {step.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{step.description}</p>
                              )}
                            </div>
                          </div>

                          {step.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {step.skills.map((skill, si) => (
                                <span key={si} className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}

                          {step.resources?.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" />
                                Resources
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {step.resources.map((resource, ri) => (
                                  <a
                                    key={ri}
                                    href={resource.startsWith("http") ? resource : `https://${resource}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    {resource.length > 40 ? resource.slice(0, 40) + "..." : resource}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </m.div>
                    );
                  })}
                </div>
              </div>
            </section>

            {selectedRoadmap.outcomes?.length > 0 && (
              <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  Expected Outcomes
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedRoadmap.outcomes.map((outcome, i) => (
                    <m.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-start gap-3"
                    >
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{outcome}</p>
                    </m.div>
                  ))}
                </div>
              </section>
            )}

            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedRoadmap.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Keep progressing through your learning path</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setSelectedRoadmap(null)}
                    variant="outline"
                    className="rounded-xl"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to List
                  </Button>
                  <Button
                    onClick={(e) => handleDelete(selectedRoadmap._id, e)}
                    variant="outline"
                    className="rounded-xl text-red-500 hover:text-red-600 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-500 dark:text-red-400 text-sm mb-4">Failed to load roadmap details.</p>
              <Button onClick={() => setSelectedRoadmap(null)} variant="outline" className="rounded-xl">
                Back to List
              </Button>
            </div>
          </section>
        )}

        <CTABanner
          title="Master Your Tech Career"
          subtitle="Stay consistent, track your progress, and become job-ready with every step."
          buttonText="Explore More Roadmaps"
          buttonLink="/careers/roadmap"
          gradient="from-emerald-600 via-teal-700 to-green-900"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />
      <PageHero
        badge="Your Journey Starts Here"
        title="Career Roadmaps"
        subtitle="Navigate your career with structured learning paths. From beginner to expert, we'll guide you every step of the way."
        gradient="from-emerald-600 via-teal-700 to-green-900"
      >
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            onClick={() => {
              if (!user) {
                navigate("/login");
                return;
              }
              setShowPicker(!showPicker);
            }}
            disabled={generating}
            className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl px-8 py-5 text-base font-semibold shadow-lg"
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Route className="h-5 w-5 mr-2" />
                Create My Roadmap
              </>
            )}
          </Button>
        </div>
        {showPicker && (
          <m.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap justify-center gap-3 mt-4"
          >
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => handleGenerate(cat.key)}
                disabled={generating}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition-all hover:scale-105 bg-gradient-to-r from-emerald-400 to-teal-500"
              >
                {cat.label}
              </button>
            ))}
          </m.div>
        )}
      </PageHero>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Your Roadmaps</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Manage and track your personalized career roadmaps</p>
        </div>

        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-500 dark:text-red-400 text-sm mb-4">{error}</p>
            <Button onClick={fetchRoadmaps} variant="outline" className="rounded-xl">
              Retry
            </Button>
          </div>
        ) : roadmaps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Inbox className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">No roadmaps yet.</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mb-4">Create your first roadmap to start your journey.</p>
            <Button
              onClick={() => {
                if (!user) { navigate("/login"); return; }
                setShowPicker(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6"
            >
              <Route className="h-4 w-4 mr-2" />
              Create My Roadmap
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmaps.map((rm, i) => (
              <m.div
                key={rm._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all group cursor-pointer"
                onClick={() => handleSelectRoadmap(rm._id)}
              >
                <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{rm.title}</h3>
                    <button
                      onClick={(e) => handleDelete(rm._id, e)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{rm.description || "No description"}</p>
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{rm.progress || 0}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${rm.progress || 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      {rm.category && (
                        <Badge variant="secondary" className={`capitalize ${categoryBadgeColor[rm.category]}`}>
                          {rm.category}
                        </Badge>
                      )}
                      {rm.difficulty && (
                        <Badge variant="secondary" className={`capitalize ${difficultyColor[rm.difficulty]}`}>
                          {rm.difficulty}
                        </Badge>
                      )}
                      {rm.estimatedDuration && (
                        <Badge variant="secondary">
                          {rm.estimatedDuration}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-medium group-hover:gap-2 transition-all whitespace-nowrap">
                      View Path <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                  </div>
                </div>
              </m.div>
            ))}
          </div>
        )}
        </m.div>
      </section>

      <CTABanner
        title="Chart Your Career Path"
        subtitle="Get a personalized roadmap tailored to your goals, skill level, and timeline."
        buttonText="Get Started"
        buttonLink="/signup"
        gradient="from-emerald-600 via-teal-700 to-green-900"
      />
    </div>
  );
}
