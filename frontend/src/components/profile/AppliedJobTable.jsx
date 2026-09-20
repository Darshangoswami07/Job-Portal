import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createConversation } from "@/api/chatApi";

export default function AppliedJobTable() {
  const { allAppliedJobs } = useSelector((store) => store.job);
  const navigate = useNavigate();
  const [messagingId, setMessagingId] = useState(null);

  const handleMessage = async (appliedjob) => {
    const applicationId = appliedjob?._id;
    if (!applicationId) return;
    setMessagingId(applicationId);
    try {
      const res = await createConversation(applicationId);
      if (res.data?.success) {
        navigate(`/chat/${res.data.conversation._id}`);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not open chat");
    } finally {
      setMessagingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusLower = (status || "pending").toLowerCase();
    switch (statusLower) {
      case "accepted":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "pending":
      default:
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    }
  };

  return (
    <div className="bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="bg-white shadow-lg rounded-2xl border border-gray-200 p-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Applied Jobs</h2>
          <span className="text-sm text-slate-500">{allAppliedJobs?.length || 0} total</span>
        </div>
        <Table className="min-w-full overflow-hidden rounded-xl">
          <TableCaption className="text-slate-600">A list of your applied jobs.</TableCaption>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-slate-700 font-semibold">Date</TableHead>
              <TableHead className="text-slate-700 font-semibold">Job Role</TableHead>
              <TableHead className="text-slate-700 font-semibold">Company</TableHead>
              <TableHead className="text-right text-slate-700 font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!allAppliedJobs || allAppliedJobs.length <= 0) ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12">
                  <div className="space-y-2">
                    <p className="text-slate-500 text-sm">No applied jobs found</p>
                    <p className="text-slate-400 text-xs">Start applying to jobs to see them here</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              allAppliedJobs.map((appliedjob, index) => {
                const job = appliedjob.job || {};
                const company = job.company || {};
                const key = appliedjob._id || `${job._id || "job"}-${appliedjob.createdAt || index}`;
                return (
                  <TableRow key={key} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="text-sm text-slate-700">
                      {appliedjob.createdAt
                        ? new Date(appliedjob.createdAt).toISOString().split("T")[0]
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-700 font-medium">
                      {job.title || "(job removed)"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {company.name || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Badge className={`px-2 py-1 rounded-full text-xs font-semibold transition-colors ${getStatusBadge(appliedjob.status)}`}>
                          {(appliedjob.status || "pending").charAt(0).toUpperCase() + (appliedjob.status || "pending").slice(1).toLowerCase()}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => handleMessage(appliedjob)}
                          disabled={messagingId === appliedjob._id}
                          className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                          aria-label="Message recruiter"
                        >
                          {messagingId === appliedjob._id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <MessageSquare className="size-3.5" />
                          )}
                          Message
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
