import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import axios from "axios";
import { APPLICATION_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import { FileText, CheckCircle2, XCircle } from "lucide-react";

const statusStyles = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

function ApplicantsTable({ applicants = [] }) {

  const statusHandler = async (status, id) => {
    try {
      const res = await axios.post(
        `${APPLICATION_API_END_POINT}/status/${id}/update`,
        { status },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(`Applicant ${status}`);
        window.location.reload();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  };

  return (
    <div className="bg-white card-shadow rounded-lg p-4 sm:p-6">
      <Table className="min-w-full">
        <TableCaption className="text-left text-sm text-gray-500">
          A list of your recent applied users
        </TableCaption>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="py-4 text-left text-sm font-semibold uppercase tracking-wide text-gray-500">FullName</TableHead>
            <TableHead className="py-4 text-left text-sm font-semibold uppercase tracking-wide text-gray-500">Email</TableHead>
            <TableHead className="py-4 text-left text-sm font-semibold uppercase tracking-wide text-gray-500">Contact</TableHead>
            <TableHead className="py-4 text-left text-sm font-semibold uppercase tracking-wide text-gray-500">Resume</TableHead>
            <TableHead className="py-4 text-left text-sm font-semibold uppercase tracking-wide text-gray-500">Applied Date</TableHead>
            <TableHead className="py-4 text-right text-sm font-semibold uppercase tracking-wide text-gray-500">Status</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {applicants.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-16 text-center">
                <div className="mx-auto max-w-sm space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <span className="text-2xl font-bold text-gray-300">!</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-gray-900">No applicants found</p>
                    <p className="text-sm text-gray-500">
                      Applications will appear here once candidates start applying.
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            applicants.map((applicantRow, index) => {
              const applicant = applicantRow.applicant || {};
              const currentStatus = (applicantRow.status || "pending").toLowerCase();

              return (
                <TableRow
                  key={applicantRow._id}
                  className="border-b border-gray-100 transition-colors hover:bg-gray-50"
                >
                  <TableCell className="py-4 text-sm font-semibold text-gray-900">
                    {applicant.fullname || "-"}
                  </TableCell>
                  <TableCell className="py-4 text-sm text-gray-500">{applicant.email || "-"}</TableCell>
                  <TableCell className="py-4 text-sm text-gray-500">{applicant.phoneNumber || "-"}</TableCell>
                  <TableCell className="py-4 text-sm">
                    {applicant.profile?.resumeOriginalName ? (
                      <a
                        href={applicant.profile?.resume}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {applicant.profile.resumeOriginalName}
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4 text-sm text-gray-500">
                    {new Date(applicantRow.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[currentStatus] || "bg-gray-100 text-gray-600"}`}>
                        {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                      </span>

                      {currentStatus === "pending" && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => statusHandler("accepted", applicantRow._id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-100"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Accept
                          </button>
                          <button
                            onClick={() => statusHandler("rejected", applicantRow._id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                          >
                            <XCircle className="h-3 w-3" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default ApplicantsTable;
