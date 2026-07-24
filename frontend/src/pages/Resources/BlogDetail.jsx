import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Calendar, User, Clock, Heart, Bookmark, Share2, ChevronLeft, ChevronRight,
  MessageSquare, Eye, Tag, Linkedin, Twitter, Facebook, Loader2, AlertCircle, ThumbsUp,
} from "lucide-react";
import axios from "axios";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BLOG_API_END_POINT } from "@/utils/constant";
import { useSelector } from "react-redux";

function parseTOC(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  const headings = div.querySelectorAll("h1, h2, h3");
  const items = [];
  headings.forEach((h) => {
    const text = h.textContent.trim();
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    h.id = id;
    items.push({ level: parseInt(h.tagName[1]), text, id });
  });
  return { items, html: div.innerHTML };
}

function renderMarkdownToHtml(markdown) {
  let html = markdown;

  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/`([^`]+)`/g, "<code class='bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400'>$1</code>");

  html = html.replace(/^> (.+)$/gm, "<blockquote class='border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400 my-4'>$1</blockquote>");

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

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href='$2' class='text-blue-600 dark:text-blue-400 underline hover:no-underline' target='_blank' rel='noopener noreferrer'>$1</a>");

  html = html.replace(/\n\n/g, "</p><p class='text-gray-700 dark:text-gray-300 leading-relaxed mb-4'>");
  html = "<p class='text-gray-700 dark:text-gray-300 leading-relaxed mb-4'>" + html + "</p>";

  html = html.replace(/<p[^>]*><\/p>/g, "");
  html = html.replace(/<p[^>]*>\s*<li/g, "<li");
  html = html.replace(/<\/li>\s*<\/p>/g, "</li>");
  html = html.replace(/<li/g, "<li");
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

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function BlogDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [blog, setBlog] = useState(null);
  const [related, setRelated] = useState([]);
  const [prev, setPrev] = useState(null);
  const [next, setNext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarksCount, setBookmarksCount] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [toc, setToc] = useState({ items: [], html: "" });
  const [activeHeading, setActiveHeading] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await axios.get(`${BLOG_API_END_POINT}/${slug}`, { withCredentials: true });
        if (data.success) {
          setBlog(data.blog);
          setPrev(data.prev);
          setNext(data.next);
          setLikesCount(data.blog.likes?.length || 0);
          setBookmarksCount(data.blog.bookmarks?.length || 0);
          setLiked(data.blog.likes?.includes(user?._id) || false);
          setBookmarked(data.blog.bookmarks?.includes(user?._id) || false);
          setComments(data.blog.comments || []);

          const content = data.blog.content || "";
          const processed = parseTOC(renderMarkdownToHtml(content));
          setToc(processed);

          const { data: relData } = await axios.get(`${BLOG_API_END_POINT}/related/${slug}`, { withCredentials: true });
          if (relData.success) setRelated(relData.blogs);
        } else {
          setError("Blog not found.");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load article.");
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
  }, []);

  const handleLike = async () => {
    if (!user) return navigate("/login");
    try {
      const { data } = await axios.post(`${BLOG_API_END_POINT}/${blog._id}/like`, {}, { withCredentials: true });
      if (data.success) {
        setLiked(data.liked);
        setLikesCount(data.likes);
      }
    } catch {}
  };

  const handleBookmark = async () => {
    if (!user) return navigate("/login");
    try {
      const { data } = await axios.post(`${BLOG_API_END_POINT}/${blog._id}/bookmark`, {}, { withCredentials: true });
      if (data.success) {
        setBookmarked(data.bookmarked);
        setBookmarksCount(data.bookmarks);
      }
    } catch {}
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) return navigate("/login");
    if (!commentText.trim()) return;
    try {
      const { data } = await axios.post(
        `${BLOG_API_END_POINT}/${blog._id}/comment`,
        { content: commentText },
        { withCredentials: true }
      );
      if (data.success) {
        setComments(data.blog.comments || []);
        setCommentText("");
      }
    } catch {}
  };

  const shareUrl = window.location.href;
  const shareTitle = blog?.title || "JobHub Blog";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
        <Navbar />
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] dark:bg-[#0D1117]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Article Not Found</h2>
          <p className="text-gray-500 mb-6">{error || "The article you're looking for doesn't exist."}</p>
          <Button onClick={() => navigate("/blogs")} variant="outline" className="rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blogs
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
          onClick={() => navigate("/blogs")}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors mb-6 text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Blogs
        </button>

        <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-10">
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {blog.coverImage && (
                <img
                  src={blog.coverImage}
                  alt={blog.title}
                  className="w-full h-64 sm:h-80 lg:h-96 object-cover rounded-2xl mb-8 shadow-lg"
                  loading="lazy"
                />
              )}

              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-0">
                  {blog.category}
                </Badge>
                {blog.featured && (
                  <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-0">
                    Featured
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                {blog.title}
              </h1>

              {blog.excerpt && (
                <p className="text-lg text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">{blog.excerpt}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-500 dark:text-gray-400 mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" /> {blog.author?.fullname || "JobHub Editorial"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> {formatDate(blog.publishedAt || blog.createdAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> {blog.readTime} min read
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" /> {blog.views} views
                </span>
              </div>

              <div
                className="prose prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: toc.html }}
              />

              {blog.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Tag className="h-4 w-4 text-gray-400 mt-1" />
                  {blog.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/blogs?search=${tag}`}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
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
                  className={`rounded-xl gap-2 ${bookmarked ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 text-blue-600" : ""}`}
                  onClick={handleBookmark}
                >
                  <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-blue-500 text-blue-500" : ""}`} />
                  {bookmarksCount}
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`)}>
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`)}>
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => navigator.clipboard.writeText(shareUrl)}>
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
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <Button type="submit" size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white" disabled={!commentText.trim()}>
                        Post Comment
                      </Button>
                    </div>
                  </form>
                ) : (
                  <p className="text-sm text-gray-500 mb-6">
                    <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link> to leave a comment.
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

              {(prev || next) && (
                <div className="flex flex-col sm:flex-row gap-4 mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
                  {prev ? (
                    <Link
                      to={`/blogs/${prev.slug}`}
                      className="flex-1 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-blue-200 transition-all group"
                    >
                      <span className="text-xs text-gray-400 flex items-center gap-1 mb-1"><ChevronLeft className="h-3 w-3" /> Previous</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1">{prev.title}</span>
                    </Link>
                  ) : <div className="flex-1" />}
                  {next ? (
                    <Link
                      to={`/blogs/${next.slug}`}
                      className="flex-1 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-blue-200 transition-all group text-right"
                    >
                      <span className="text-xs text-gray-400 flex items-center gap-1 justify-end mb-1">Next <ChevronRight className="h-3 w-3" /></span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1">{next.title}</span>
                    </Link>
                  ) : <div className="flex-1" />}
                </div>
              )}
            </motion.div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24">
              {toc.items.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Table of Contents</h4>
                  <nav className="space-y-1">
                    {toc.items.map((item, i) => (
                      <a
                        key={i}
                        href={`#${item.id}`}
                        className={`block text-sm py-1 transition-colors ${
                          activeHeading === item.id
                            ? "text-blue-600 font-medium"
                            : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        }`}
                        style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {related.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Related Articles</h4>
                  <div className="space-y-3">
                    {related.map((r) => (
                      <Link
                        key={r._id}
                        to={`/blogs/${r.slug}`}
                        className="block group"
                      >
                        {r.coverImage && (
                          <img src={r.coverImage} alt="" className="w-full h-24 object-cover rounded-lg mb-2" loading="lazy" />
                        )}
                        <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2">
                          {r.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                          <Clock className="h-3 w-3" /> {r.readTime} min
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

      <Footer />
    </div>
  );
}