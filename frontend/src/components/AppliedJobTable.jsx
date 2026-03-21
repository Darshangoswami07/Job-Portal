import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { useSelector } from "react-redux";

export default function AppliedJobTable() {
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
                      {appliedjob.createdAt?.split("T")[0] || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-700 font-medium">
                      {job.title || "(job removed)"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {company.name || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className={`px-2 py-1 rounded-full text-xs font-semibold transition-colors ${getStatusBadge(appliedjob.status)}`}>
                        {(appliedjob.status || "pending").charAt(0).toUpperCase() + (appliedjob.status || "pending").slice(1).toLowerCase()}
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
