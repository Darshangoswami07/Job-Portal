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
import useGetAppliedJobs from "@/hooks/useGetAppliedJobs";

export default function AppliedJobs() {
  useGetAppliedJobs();
  const { allAppliedJobs } = useSelector((store) => store.job);

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
    <div className="mt-5 rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Applied Jobs</h2>
        <span className="text-sm text-slate-500">{allAppliedJobs?.length || 0} total</span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <Table className="min-w-full overflow-hidden rounded-xl">
          <TableCaption className="text-slate-600">A list of your applied jobs.</TableCaption>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold text-slate-700">Date</TableHead>
              <TableHead className="font-semibold text-slate-700">Job Role</TableHead>
              <TableHead className="font-semibold text-slate-700">Company</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!allAppliedJobs || allAppliedJobs.length <= 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center">
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500">No applied jobs found</p>
                    <p className="text-xs text-slate-400">
                      Start applying to jobs to see them here
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              allAppliedJobs.map((appliedjob, index) => {
                const job = appliedjob.job || {};
                const company = job.company || {};
                const key = appliedjob._id || `${job._id || "job"}-${appliedjob.createdAt || index}`;

                return (
                  <TableRow key={key} className="transition-colors hover:bg-slate-50">
                    <TableCell className="text-sm text-slate-700">
                      {appliedjob.createdAt
                        ? new Date(appliedjob.createdAt).toISOString().split("T")[0]
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-700">
                      {job.title || "(job removed)"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {company.name || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        className={`rounded-full px-2 py-1 text-xs font-semibold transition-colors ${getStatusBadge(appliedjob.status)}`}
                      >
                        {(appliedjob.status || "pending").charAt(0).toUpperCase() +
                          (appliedjob.status || "pending").slice(1).toLowerCase()}
                      </Badge>
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