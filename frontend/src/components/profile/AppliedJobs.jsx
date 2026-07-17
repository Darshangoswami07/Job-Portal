import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import useGetAppliedJobs from "@/hooks/useGetAppliedJobs";
import { useSelector } from "react-redux";

const statusStyles = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function AppliedJobs() {
  useGetAppliedJobs();
  const { allAppliedJobs } = useSelector((store) => store.job);

  const isEmpty = !allAppliedJobs || allAppliedJobs.length === 0;

  return (
    <div className="mt-5 bg-white card-shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-600 text-sm">Date</TableHead>
              <TableHead className="font-semibold text-gray-600 text-sm">Job Role</TableHead>
              <TableHead className="font-semibold text-gray-600 text-sm">Company</TableHead>
              <TableHead className="text-right font-semibold text-gray-600 text-sm">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isEmpty ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                      <span className="text-2xl font-bold text-gray-300">!</span>
                    </div>
                    <h3 className="text-base font-semibold text-gray-700">No applied jobs yet</h3>
                    <p className="mt-1 text-sm text-gray-400">
                      Start exploring and apply to jobs that match your skills
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              allAppliedJobs.map((appliedjob, index) => {
                const job = appliedjob.job || {};
                const company = job.company || {};
                const key = appliedjob._id || `${job._id || "job"}-${appliedjob.createdAt || index}`;
                const status = (appliedjob.status || "pending").toLowerCase();

                return (
                  <TableRow
                    key={key}
                    className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50/60"
                  >
                    <TableCell className="text-sm text-gray-600">
                      {appliedjob.createdAt
                        ? new Date(appliedjob.createdAt).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric"
                          })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-800">
                      {job.title || (
                        <span className="italic text-gray-400">(job removed)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {company.name || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status] || "bg-gray-100 text-gray-600"}`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
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
