import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import axios from "axios";
import { APPLICATION_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";

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
        // refresh data after status update
        window.location.reload();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  };

  return (
    <div className="bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="bg-white shadow-lg rounded-2xl border border-gray-200 p-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Applicants</h2>
          <span className="text-sm text-slate-500">{applicants.length} total</span>
        </div>
        <Table className="min-w-full overflow-hidden rounded-xl">
        <TableCaption>A list of your recent applied users</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>FullName</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Resume</TableHead>
            <TableHead>Applied On</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {applicants.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-slate-500">
                No applicants found
              </TableCell>
            </TableRow>
          ) : (
            applicants.map((applicantRow) => {
              const applicant = applicantRow.applicant || {};
              const currentStatus = (applicantRow.status || "pending").toLowerCase();

              return (
                <TableRow key={applicantRow._id} className="hover:bg-slate-50">
                  <TableCell className="text-sm text-slate-700 font-medium">
                    {applicant.fullname || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{applicant.email || "-"}</TableCell>
                  <TableCell className="text-sm text-slate-600">{applicant.phoneNumber || "-"}</TableCell>
                  <TableCell className="text-sm text-blue-600">
                    {applicant.profile?.resumeOriginalName ? (
                      <a href={applicant.profile?.resume} target="_blank" rel="noreferrer" className="hover:underline">
                        {applicant.profile.resumeOriginalName}
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {new Date(applicantRow.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right pb-2 pt-2">
                    <div className="flex items-center justify-end gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[currentStatus] || "bg-slate-100 text-slate-600"}`}>
                        {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                      </span>

                      {currentStatus === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => statusHandler("accepted", applicantRow._id)}
                            className="rounded-lg border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-100"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => statusHandler("rejected", applicantRow._id)}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
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
    </div>
  );
}

export default ApplicantsTable;
