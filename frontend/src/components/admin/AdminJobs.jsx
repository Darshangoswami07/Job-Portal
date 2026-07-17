import React, { useEffect, useState } from "react";
import Navbar from "@/components/shared/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { setSearchJobByText } from "@/store/slices/jobSlice";
import { useDispatch } from "react-redux";
import AdminJobsTable from "./AdminJobsTable";
import useGetAllAdminJobs from "@/hooks/useGetAllAdminJobs";
import { Search, Plus } from "lucide-react";

export default function AdminJobs() {
  useGetAllAdminJobs();
  const [input, setInput] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setSearchJobByText(input));
  }, [input, dispatch]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="bg-white card-shadow rounded-lg p-6 sm:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Posted Jobs</h1>
                <p className="mt-1 text-sm text-gray-500">Review and manage current job postings.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    className="w-full min-w-60 rounded-lg border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm shadow-sm focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20"
                    placeholder="Filter by name"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                </div>
                <Button
                  className="btn-primary rounded-lg px-5 py-2.5 text-sm font-semibold"
                  onClick={() => navigate("/admin/jobs/create")}
                >
                  <Plus className="h-4 w-4" />
                  New Job
                </Button>
              </div>
            </div>
          </div>
          <AdminJobsTable />
        </div>
      </div>
    </div>
  );
}
