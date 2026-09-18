import { useState } from "react";
import axios from "axios";
import { Flag, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SUPPORT_TICKET_API_END_POINT } from "@/utils/constant";
import { cn } from "@/lib/utils";

const REASONS = [
  "Spam or misleading content",
  "Incorrect salary or location",
  "Fake job posting",
  "Discriminatory or offensive content",
  "Expired or already filled",
  "Other",
];

export default function ReportDialog({ open, onOpenChange, job, user }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const reset = () => {
    setReason(REASONS[0]);
    setSubmitting(false);
    setDone(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const name = user?.fullname || "Guest user";
      const email = user?.email || "guest@jobpilot.ai";
      await axios.post(`${SUPPORT_TICKET_API_END_POINT}/`, {
        name,
        email,
        subject: `Report: ${job?.title || "Job posting"}`,
        category: "job-report",
        message: `Reason: ${reason}\nJob: ${job?.title} at ${job?.company?.name || "unknown company"}\nJob URL: ${window.location.href}`,
      });
      setDone(true);
      setTimeout(() => {
        onOpenChange(false);
        reset();
      }, 1200);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border border-slate-200 dark:border-slate-700 sm:max-w-md">
        {done ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-14 w-14 text-emerald-500" />
            <DialogTitle className="mt-4 text-xl">Report submitted</DialogTitle>
            <DialogDescription className="mt-1">
              Thanks for keeping JobPilot safe. Our team will review it shortly.
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Flag className="h-5 w-5 text-rose-500" />
                Report this job
              </DialogTitle>
              <DialogDescription>
                Let us know what is wrong with this posting. This will not be shared with the recruiter.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all",
                    reason === r
                      ? "border-rose-300 bg-rose-50 text-rose-700 ring-2 ring-rose-200 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      reason === r
                        ? "border-rose-500 bg-rose-500"
                        : "border-slate-300 dark:border-slate-600"
                    )}
                  >
                    {reason === r && <span className="h-2 w-2 rounded-full bg-white" />}
                  </span>
                  {r}
                </button>
              ))}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit report"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
