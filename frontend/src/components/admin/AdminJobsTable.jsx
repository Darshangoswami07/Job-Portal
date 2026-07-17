import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Edit2, Eye, MoreHorizontal, Briefcase } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function AdminJobsTable() {
  const { allAdminJobs = [], searchJobByText = "" } = useSelector((store) => store.job || {});
  const navigate = useNavigate();

  const filteredJobs = React.useMemo(() => {
    const text = searchJobByText.toLowerCase();
    return allAdminJobs.filter((job) => {
      if (!text) return true;
      return (
        job.company?.name?.toLowerCase().includes(text) ||
        job.title?.toLowerCase().includes(text)
      );
    });
  }, [allAdminJobs, searchJobByText]);

  return (
    <div className="bg-white card-shadow rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Company Name</TableHead>
            <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Role</TableHead>
            <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Date</TableHead>
            <TableHead className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredJobs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-12 text-center">
                <Briefcase className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-700">No jobs found yet</p>
                <p className="text-xs text-gray-500 mt-1">Create your first job to start receiving applicants.</p>
                <Button
                  className="mt-4 btn-primary rounded-lg px-4 py-2 text-sm"
                  onClick={() => navigate("/admin/jobs/create")}
                >
                  Create New Job
                </Button>
              </TableCell>
            </TableRow>
          ) : (
            filteredJobs.map((job) => (
              <TableRow key={job._id} className="hover:bg-gray-50 transition-colors">
                <TableCell className="py-3 text-sm font-medium text-gray-900">{job?.company?.name || "-"}</TableCell>
                <TableCell className="py-3 text-sm text-gray-700">{job?.title}</TableCell>
                <TableCell className="py-3 text-sm text-gray-500">{job?.createdAt?.split("T")[0]}</TableCell>
                <TableCell className="py-3 text-right">
                  <Popover>
                    <PopoverTrigger className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
                      <MoreHorizontal className="h-4 w-4 text-gray-500" />
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-40 p-1.5">
                      <button
                        onClick={() => navigate(`/admin/jobs/${job._id}`)}
                        className="flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => navigate(`/admin/jobs/${job._id}/applicants`)}
                        className="flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Applicants
                      </button>
                    </PopoverContent>
                  </Popover>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
