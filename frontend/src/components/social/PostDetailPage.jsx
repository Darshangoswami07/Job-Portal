import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ArrowLeft, Flag, X } from "lucide-react";
import { toast } from "sonner";
import { fetchPost, reportTarget } from "@/api/socialApi";
import { useSelector } from "react-redux";
import PostCard from "./PostCard";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/shared/Navbar";

const REPORT_REASONS = [
  "Spam or misleading",
  "Harassment or hate speech",
  "Violence or dangerous content",
  "Intellectual property",
  "Inappropriate content",
  "Fake job / scam",
];

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = useSelector((s) => s.auth.user);
  const viewerId = currentUser ? String(currentUser._id) : '';
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(searchParams.get("report") === "1");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchPost(id).then((res) => {
      if (mounted && res.data?.success) setPost(res.data.post);
    }).catch((err) => {
      toast.error(err.response?.data?.message || "Post not found");
      navigate("/feed");
    }).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [id, navigate]);

  const submitReport = async () => {
    if (!reason) { toast.error("Please select a reason"); return; }
    setSubmitting(true);
    try {
      await reportTarget({ targetType: "post", targetId: id, reason, details });
      toast.success("Report submitted. Thank you for keeping JobPilot safe.");
      setReportOpen(false);
      setSearchParams({});
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="size-8 animate-spin text-[#0A66C2]" /></div>;
  }

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="size-4" /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {post && <PostCard post={post} viewerId={viewerId} defaultCommentsOpen />}
      </motion.div>

      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setReportOpen(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-foreground"><Flag className="size-5 text-amber-500" /> Report post</h3>
              <button onClick={() => setReportOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
            </div>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition ${reason === r ? "border-amber-400 bg-amber-50 dark:bg-amber-500/10" : "border-border hover:border-amber-300"}`}
                >
                  {r}
                </button>
              ))}
            </div>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              placeholder="Add more details (optional)"
              className="mt-3 w-full rounded-xl border border-border bg-muted/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setReportOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={submitReport} disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" />} Submit report
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
    </>
  );
}