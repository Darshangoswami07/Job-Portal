import React from "react";
import { motion as Motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Edit2, Eye, MoreHorizontal } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";

export default function AdminJobsTable() {
  // read jobs and search text from the job slice (not company)
  const { allAdminJobs = [], searchJobByText = "" } =
    useSelector((store) => store.job || {});

  // compute filtered jobs on-the-fly instead of storing in state
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
    <div className="overflow-hidden rounded-[2rem] bg-white p-4 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.18)] sm:p-6">
      <Table className="min-w-full bg-white">
        <TableCaption className="text-left text-sm text-slate-500">
          A list of your recently posted jobs.
        </TableCaption>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
              Company Name
            </TableHead>
            <TableHead className="py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
              Role
            </TableHead>
            <TableHead className="py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
              Date
            </TableHead>
            <TableHead className="py-4 text-right text-sm font-semibold uppercase tracking-wide text-slate-500">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredJobs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="p-10 text-center">
                <div className="mx-auto max-w-md space-y-3 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10">
                  <p className="text-lg font-semibold text-slate-800">No jobs found yet</p>
                  <p className="text-sm text-slate-500">
                    Create your first job to start receiving applicants.
                  </p>
                  <div className="flex justify-center">
                    <Button className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700" onClick={() => navigate("/admin/jobs/create")}>Create New Job</Button>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredJobs.map((job) => (
              <Motion.tr
                key={job._id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                whileHover={{ y: -2 }}
                className="group border-b border-slate-200 bg-white transition duration-300 hover:bg-slate-50"
              >
                <TableCell className="py-4">
                  <div className="text-sm font-semibold text-slate-900">{job?.company?.name || "-"}</div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-slate-900">{job?.title}</p>
                  </div>
                </TableCell>
                <TableCell className="py-4 text-sm text-slate-500">{job?.createdAt?.split("T")[0]}</TableCell>
                <TableCell className="py-4 text-right">
                  <Popover>
                    <PopoverTrigger>
                      <MoreHorizontal className="text-slate-500 transition hover:text-slate-900" />
                    </PopoverTrigger>
                    <PopoverContent className="w-36 rounded-3xl bg-white p-3 shadow-2xl ring-1 ring-slate-200">
                      <div
                        onClick={() =>
                          navigate(`/admin/jobs/${job._id}`)
                        }
                        className="flex items-center gap-2 w-fit cursor-pointer text-sm text-slate-700 transition hover:text-slate-900"
                      >
                        <Edit2 className="w-4" />
                        <span>Edit</span>
                      </div>
                      <div
                        onClick={() => navigate(`/admin/jobs/${job._id}/applicants`)}
                        className="flex items-center w-fit gap-2 cursor-pointer mt-2 text-sm text-slate-700 transition hover:text-slate-900"
                      >
                        <Eye className="w-4" />
                        <span>Applicants</span>
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableCell>
                </Motion.tr>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
