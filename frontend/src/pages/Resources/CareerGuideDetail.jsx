import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Calendar, User, Clock, Heart, Bookmark, Share2, ChevronRight,
  MessageSquare, Eye, Tag, Loader2, AlertCircle, Star, TrendingUp,
  GraduationCap, BarChart3, Linkedin, Twitter, CheckCircle,
} from "lucide-react";
import axios from "axios";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CAREER_GUIDE_API_END_POINT } from "@/utils/constant";
import { useSelector } from "react-redux";
import { copyToClipboard } from "@/utils/clipboard";
import { sanitizeHtml } from "@/utils/sanitize";

function renderMarkdownToHtml(markdown) {
  let html = markdown;

  html = html.replace(/^### (.+)$/gm, "<h3 id='$1'>$1</h3>");
  html = html.replace(/^## (.+)$/gm, (_, title) => {
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return `<h2 id="${id}">${title}</h2>`;
  });
  html = html.replace(/^# (.+)$/gm, (_, title) => {
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return `<h1 id="${id}">${title}</h1>`;
  });

  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/`([^`]+)`/g, "<code class='bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400'>$1</code>");

  html = html.replace(/^> (.+)$/gm, "<blockquote class='border-l-4 border-amber-500 pl-4 italic text-gray-600 dark:text-gray-400 my-4'>$1</blockquote>");

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<pre class="bg-gray-900 text-gray-100 rounded-xl p-4 overflow-x-auto my-4 text-sm leading-relaxed"><code class="language-${lang || 'text'}">${escaped}</code></pre>`;
  });

  html = html.replace(/^\- (.+)$/gm, "<li class='ml-4 list-disc text-gray-700 dark:text-gray-300'>$1</li>");
  html = html.replace(/^(\d+)\. (.+)$/gm, "<li class='ml-4 list-decimal text-gray-700 dark:text-gray-300'>$1. $2</li>");

  html = html.replace(/\|(.+)\|/g, (match) => {
    if (match.trim() === "|---|") return "";
    const cells = match.split("|").filter(Boolean);
    return `<tr>${cells.map((c) => `<td class='border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm'>${c.trim()}</td>`).join("")}</tr>`;
  });

  html = html.replace(/^---+\s*$/gm, "<hr class='my-8 border-gray-200 dark:border-gray-700' />");

  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "<img src='$2' alt='$1' class='rounded-xl my-6 w-full max-h-96 object-cover' loading='lazy' />");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href='$2' class='text-amber-600 dark:text-amber-400 underline hover:no-underline' target='_blank' rel='noopener noreferrer'>$1</a>");

  html = html.replace(/\n\n/g, "</p><p class='text-gray-700 dark:text-gray-300 leading-relaxed mb-4'>");
  html = "<p class='text-gray-700 dark:text-gray-300 leading-relaxed mb-4'>" + html + "</p>";

  html = html.replace(/<p[^>]*><\/p>/g, "");
  html = html.replace(/<p[^>]*>\s*<li/g, "<li");
  html = html.replace(/<\/li>\s*<\/p>/g, "</li>");
  html = html.replace(/<p[^>]*>\s*<tr/g, "<tr");
  html = html.replace(/<\/tr>\s*<\/p>/g, "</tr>");
  html = html.replace(/<p[^>]*>\s*<pre/g, "<pre");
  html = html.replace(/<\/pre>\s*<\/p>/g, "</pre>");
  html = html.replace(/<p[^>]*>\s*<blockquote/g, "<blockquote");
  html = html.replace(/<\/blockquote>\s*<\/p>/g, "</blockquote>");
  html = html.replace(/<p[^>]*>\s*<hr/g, "<hr");
  html = html.replace(/<\/?p[^>]*>\s*<\/hr>/g, "");

  return html;
}

function extractTOC(markdown) {
  const items = [];
  const lines = markdown.split("\n");
  lines.forEach((line) => {
    const h2Match = line.match(/^## (.+)$/);
    const h3Match = line.match(/^### (.+)$/);
    if (h2Match) {
      const text = h2Match[1];
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      items.push({ level: 2, text, id });
    } else if (h3Match) {
      const text = h3Match[1];
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      items.push({ level: 3, text, id });
    }
  });
  return items;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

const difficultyColors = {
  1: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  2: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  3: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  4: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  5: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  6: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  7: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  8: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  9: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  10: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export default function CareerGuideDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [guide, setGuide] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarksCount, setBookmarksCount] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [toc, setToc] = useState([]);
  const [activeHeading, setActiveHeading] = useState("");
  const [htmlContent, setHtmlContent] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await axios.get(`${CAREER_GUIDE_API_END_POINT}/${slug}`);
        if (data.success) {
          setGuide(data.guide);
          setRelated(data.related || []);
          setLikesCount(data.guide.likes?.length || 0);
          setBookmarksCount(data.guide.bookmarks?.length || 0);
          setLiked(data.guide.likes?.includes(user?._id) || false);
          setBookmarked(data.guide.bookmarks?.includes(user?._id) || false);
          setComments(data.guide.comments || []);

          const content = data.guide.content || "";
          setToc(extractTOC(content));
          setHtmlContent(renderMarkdownToHtml(content));
        } else {
          setError("Guide not found.");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load guide.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, user?._id]);

  useEffect(() => {
    const handleScroll = () => {
      const headings = document.querySelectorAll("h2, h3");
      let current = "";
      headings.forEach((h) => {
        if (h.getBoundingClientRect().top <= 100) current = h.id;
      });
      setActiveHeading(current);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [htmlContent]);

  const handleLike = async () => {
    if (!user) return navigate("/login");
    try {
      const { data } = await axios.post(`${CAREER_GUIDE_API_END_POINT}/${guide._id}/like`, {});
      if (data.success) {
        setLiked(data.liked);
        setLikesCount(data.likes.length);
      }
    } catch {}
  };

  const handleBookmark = async () => {
    if (!user) return navigate("/login");
    try {
      const { data } = await axios.post(`${CAREER_GUIDE_API_END_POINT}/${guide._id}/bookmark`, {});
      if (data.success) {
        setBookmarked(data.bookmarked);
        setBookmarksCount(data.bookmarks.length);
      }
    } catch {}
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) return navigate("/login");
    if (!commentText.trim()) return;
    try {
      const { data } = await axios.post(
        `${CAREER_GUIDE_API_END_POINT}/${guide._id}/comment`,
        { content: commentText }
      );
      if (data.success) {
        setComments(data.comments || []);
        setCommentText("");
      }
    } catch {}
  };

  const shareUrl = window.location.href;
  const shareTitle = guide?.title || "Career Guide";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
        <Navbar />
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-amber-600" />
        </div>
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Guide Not Found</h2>
          <p className="text-gray-500 mb-6">{error || "The career guide you're looking for doesn't exist."}</p>
          <Button onClick={() => navigate("/career-guides")} variant="outline" className="rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Guides
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />

      <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate("/career-guides")}
          className="flex items-center gap-2 text-gray-500 hover:text-amber-600 transition-colors mb-6 text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Career Guides
        </button>

        <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-10">
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {guide.coverImage && (
                <div className="relative">
                  <img
                    src={guide.coverImage}
                    alt={guide.title}
                    className="w-full h-64 sm:h-80 lg:h-96 object-cover rounded-2xl mb-8 shadow-lg"
                    loading="lazy"
                  />
                  {guide.featured && (
                    <div className="absolute top-4 left-4 flex gap-2">
                      <Badge className="bg-amber-500 text-white border-0 flex items-center gap-1">
                        <Star className="h-3 w-3 fill-white" /> Featured
                      </Badge>
                    </div>
                  )}
                  {guide.trending && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-red-500 text-white border-0 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Trending
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-0">
                  {guide.category}
                </Badge>
                {guide.beginnerFriendly && (
                  <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-0 flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" /> Beginner Friendly
                  </Badge>
                )}
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${difficultyColors[guide.difficulty] || difficultyColors[5]}`}>
                  Level: {guide.level}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                {guide.title}
              </h1>

              {guide.excerpt && (
                <p className="text-lg text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">{guide.excerpt}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-500 dark:text-gray-400 mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" /> {guide.author?.fullname || "JobPilot Ai Editorial"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> {formatDate(guide.publishedAt || guide.createdAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> {guide.readTime} min read
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" /> {guide.views} views
                </span>
                {guide.completionTime > 0 && (
                  <span className="flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4" /> ~{Math.round(guide.completionTime / 60)}h to complete
                  </span>
                )}
              </div>

              {guide.sections?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 mb-8">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-500" /> What You&apos;ll Learn
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {guide.sections.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                        {s.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div
                className="prose prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlContent) }}
              />

              {guide.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Tag className="h-4 w-4 text-gray-400 mt-1" />
                  {guide.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/career-guides?search=${tag}`}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}

              {guide.references?.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">References</h3>
                  <ul className="space-y-1">
                    {guide.references.map((ref, i) => (
                      <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">{i + 1}.</span> {ref}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  size="sm"
                  className={`rounded-xl gap-2 ${liked ? "bg-red-50 dark:bg-red-900/20 border-red-200 text-red-600" : ""}`}
                  onClick={handleLike}
                >
                  <Heart className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : ""}`} />
                  {likesCount}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`rounded-xl gap-2 ${bookmarked ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 text-amber-600" : ""}`}
                  onClick={handleBookmark}
                >
                  <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-amber-500 text-amber-500" : ""}`} />
                  {bookmarksCount}
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`)}>
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`)}>
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => copyToClipboard(shareUrl)}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" /> Comments ({comments.length})
                </h3>

                {user ? (
                  <form onSubmit={handleComment} className="mb-6">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Share your thoughts..."
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <Button type="submit" size="sm" className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white" disabled={!commentText.trim()}>
                        Post Comment
                      </Button>
                    </div>
                  </form>
                ) : (
                  <p className="text-sm text-gray-500 mb-6">
                    <Link to="/login" className="text-amber-600 hover:underline">Sign in</Link> to leave a comment.
                  </p>
                )}

                <div className="space-y-4">
                  {comments.map((c, i) => (
                    <div key={i} className="flex gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                      <img
                        src={c.user?.profile?.profilePhoto || "https://via.placeholder.com/40"}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{c.user?.fullname || "Anonymous"}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{c.content}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(c.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No comments yet. Be the first to share your thoughts!</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {toc.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Table of Contents</h4>
                  <nav className="space-y-1">
                    {toc.map((item, i) => (
                      <a
                        key={i}
                        href={`#${item.id}`}
                        className={`block text-sm py-1 transition-colors ${
                          activeHeading === item.id
                            ? "text-amber-600 font-medium"
                            : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        }`}
                        style={{ paddingLeft: `${(item.level - 2) * 12}px` }}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {guide.resources?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Resources</h4>
                  <ul className="space-y-1">
                    {guide.resources.map((r, i) => (
                      <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                        <ChevronRight className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {related.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Related Guides</h4>
                  <div className="space-y-3">
                    {related.slice(0, 4).map((r) => (
                      <Link
                        key={r._id}
                        to={`/career-guides/${r.slug}`}
                        className="block group"
                      >
                        {r.coverImage && (
                          <img src={r.coverImage} alt="" className="w-full h-20 object-cover rounded-lg mb-2" loading="lazy" />
                        )}
                        <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-amber-600 transition-colors line-clamp-2">
                          {r.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                          <Clock className="h-3 w-3" /> {r.readTime} min
                          {r.featured && <Star className="h-3 w-3 text-amber-500" />}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Related Guides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((r, i) => (
              <Link
                key={r._id}
                to={`/career-guides/${r.slug}`}
                className="block group"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-amber-200 dark:hover:border-amber-800 transition-all"
                >
                  {r.coverImage && (
                    <img src={r.coverImage} alt="" className="w-full h-40 object-cover" loading="lazy" />
                  )}
                  <div className="p-4">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <Badge variant="secondary" className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-0 text-xs">{r.category}</Badge>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 group-hover:text-amber-600 transition-colors line-clamp-2">{r.title}</h3>
                    <p className="text-xs text-gray-400 flex items-center gap-2">
                      <Clock className="h-3 w-3" /> {r.readTime} min
                      {r.featured && <Star className="h-3 w-3 text-amber-500" />}
                    </p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}