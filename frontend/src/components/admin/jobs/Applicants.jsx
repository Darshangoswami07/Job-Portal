import React, { useEffect, useState, useMemo } from "react";
import Navbar from "@/components/shared/Navbar";
import axios from "axios";
import { APPLICATION_API_END_POINT, JOB_API_END_POINT } from "@/utils/constant";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setAllApplicants } from "@/store/slices/applicationSlice";
import { ArrowLeft, Users, UserCheck, CheckCircle2, XCircle, LayoutGrid, List, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import KanbanBoard from "@/components/recruiter/KanbanBoard";
import ApplicantsTable from "./ApplicantsTable";
import { createConversation } from "@/api/chatApi";
import PageHeader from "@/components/recruiter/PageHeader";
import StatCard from "@/components/recruiter/StatCard";
import { SkeletonTable } from "@/components/recruiter/Skeleton";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function Applicants() {
  const params = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { Applicants } = useSelector((store) => store.application || {});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("kanban");
  const [jobTitle, setJobTitle] = useState("");

  const fetchApplicants = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${APPLICATION_API_END_POINT}/${params.id}/applicant`,
        { withCredentials: true }
      );
      dispatch(setAllApplicants(res.data?.job?.applications || []));
      setJobTitle(res.data?.job?.title || "");
    } catch (error) {
      console.error("Error fetching applicants:", error);
      dispatch(setAllApplicants([]));
    } finally {
      setLoading(false);
    }
  }, [dispatch, params.id]);

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  const stats = useMemo(() => {
    const list = Applicants || [];
    return {
      total: list.length,
      reviewed: list.filter((a) => a.status === "reviewed").length,
      interviewing: list.filter((a) => a.status === "interviewing").length,
      hired: list.filter((a) => a.status === "hired").length,
      rejected: list.filter((a) => a.status === "rejected").length,
      pending: list.filter((a) => !a.status || a.status === "pending").length,
    };
  }, [Applicants]);

  const handleStatusChange = (id, status) => {
    dispatch(
      setAllApplicants(
        (Applicants || []).map((a) => (a._id === id ? { ...a, status } : a))
      )
    );
  };

  const handleMessage = async (applicantRow) => {
    const applicationId = applicantRow?._id;
    if (!applicationId) return;
    try {
      const res = await createConversation(applicationId);
      if (res.data?.success) {
        navigate(`/chat/${res.data.conversation._id}`);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not open chat");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Candidate Pipeline"
          title={jobTitle ? `Candidates · ${jobTitle}` : "Candidate Management"}
          subtitle="Manage your talent pipeline with drag & drop. Move candidates through every stage until they're hired."
          icon={Users}
        >
          <Button variant="outline" onClick={() => navigate("/admin/jobs")} className="rounded-xl">
            <ArrowLeft className="size-4" /> My Jobs
          </Button>
          <div className="flex rounded-xl bg-muted p-1">
            {[
              { id: "kanban", icon: LayoutGrid, label: "Board" },
              { id: "list", icon: List, label: "List" },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-xs font-semibold transition",
                  view === v.id ? "text-white" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {view === v.id && (
                  <motion.span
                    layoutId="applicant-view"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute inset-0 rounded-[10px] bg-gradient-to-r from-indigo-500 to-blue-600 shadow"
                  />
                )}
                <v.icon className="relative z-10 size-3.5" />
                <span className="relative z-10">{v.label}</span>
              </button>
            ))}
          </div>
        </PageHeader>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Total" value={stats.total} icon={Users} variant="indigo" index={0} />
          <StatCard label="Applied" value={stats.pending} icon={Briefcase} variant="sky" index={1} />
          <StatCard label="Reviewed" value={stats.reviewed} icon={CheckCircle2} variant="violet" index={2} />
          <StatCard label="Interviews" value={stats.interviewing} icon={UserCheck} variant="amber" index={3} />
          <StatCard label="Hired" value={stats.hired} icon={CheckCircle2} variant="emerald" index={4} />
          <StatCard label="Rejected" value={stats.rejected} icon={XCircle} variant="rose" index={5} />
        </div>

        {loading ? (
          <SkeletonTable rows={5} />
        ) : view === "kanban" ? (
          <KanbanBoard applicants={Applicants || []} onStatusChange={handleStatusChange} onMessage={handleMessage} />
        ) : (
          <ApplicantsTable applicants={Applicants || []} onStatusChange={handleStatusChange} onMessage={handleMessage} />
        )}
      </div>
    </div>
  );
}

export default Applicants;
