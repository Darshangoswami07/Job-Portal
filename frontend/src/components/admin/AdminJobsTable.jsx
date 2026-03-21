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
    <div>
      <Table>
        <TableCaption>A List Of Your recent register Jobs</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Company Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredJobs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="p-10 text-center">
                <div className="space-y-3">
                  <p className="text-lg font-semibold text-slate-800">
                    No jobs found yet
                  </p>
                  <p className="text-sm text-slate-500">
                    Create your first job to start receiving applicants.
                  </p>
                  <div className="flex justify-center">
                    <Button onClick={() => navigate("/admin/jobs/create")}>
                      Create New Job
                    </Button>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredJobs.map((job) => (
              <TableRow key={job._id}>
                {/* show company name if populated; otherwise just show title */}
                <TableCell>{job?.company?.name || "-"}</TableCell>
                <TableCell>{job?.title}</TableCell>
                <TableCell>{job?.createdAt?.split("T")[0]}</TableCell>
                <TableCell className="text-right cursor-pointer">
                  <Popover>
                    <PopoverTrigger>
                      <MoreHorizontal />
                    </PopoverTrigger>
                    <PopoverContent className="w-32">
                      <div
                        onClick={() =>
                          navigate(`/admin/jobs/${job._id}`)
                        }
                        className="flex items-center gap-2 w-fit cursor-pointer"
                      >
                        <Edit2 className="w-4" />
                        <span>Edit</span>
                      </div>
                      <div onClick={()=>navigate(`/admin/jobs/${job._id}/applicants`)} className="flex items-center w-fit gap-2 cursor-pointer mt-2">
                        <Eye className="w-4"/>
                        <span>Applicants</span>
                      </div>
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
