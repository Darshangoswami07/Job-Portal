import React, { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { setSearchJobByText, setAllAdminJobs } from "@/store/slices/jobSlice";
import { useDispatch, useSelector } from "react-redux";
import AdminJobsTable from "./AdminJobsTable";
import PageHeader from "@/components/recruiter/PageHeader";
import StatCard from "@/components/recruiter/StatCard";
import { Search, Plus, Briefcase, Users, Eye, Building2, Hourglass } from "lucide-react";
import { Input } from "@/components/ui/input";
import useGetAllAdminJobs from "@/hooks/useGetAllAdminJobs";
import axios from "axios";
import { JOB_API_END_POINT } from "@/utils/constant";
import { motion } from "framer-motion";

export default function AdminJobs() {
  useGetAllAdminJobs();
  const [input, setInput] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { allAdminJobs = [] } = useSelector((s) => s.job || {});

  useEffect(() => {
    dispatch(setSearchJobByText(input));
  }, [input, dispatch]);

  const refetch = useCallback(async () => {
    try {
      const res = await axios.get(`${JOB_API_END_POINT}/getadminjobs`, { withCredentials: true });
      if (res.data.success) dispatch(setAllAdminJobs(res.data.jobs || []));
    } catch {
      dispatch(setAllAdminJobs([]));
    }
  }, [dispatch]);

  useEffect(() => {
    if (refreshKey > 0) refetch();
  }, [refreshKey, refetch]);

  const total = allAdminJobs.length;
  const active = allAdminJobs.filter((j) => j.isActive !== false).length;
  const applications = allAdminJobs.reduce((s, j) => s + (j.applicantsCount ?? j.applications?.length ?? 0), 0);
  const views = allAdminJobs.reduce((s, j) => s + (j.views || 0), 0);
  const positions = allAdminJobs.reduce((s, j) => s + (j.position || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Recruiter Studio"
          title="My Jobs"
          subtitle="Review, manage and analyze all your job postings in one place."
          icon={Briefcase}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Filter by name, role, location..."
              className="w-full min-w-64 rounded-xl border-border/70 bg-background pl-10"
              aria-label="Filter jobs"
            />
          </div>
          <Button
            onClick={() => navigate("/admin/jobs/create")}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-blue-700"
          >
            <Plus className="h-4 w-4" /> New Job
          </Button>
        </PageHeader>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard label="Total Jobs" value={total} icon={Briefcase} variant="indigo" hint={`${positions} open positions`} index={0} />
          <StatCard label="Active Jobs" value={active} icon={Hourglass} variant="sky" hint="Currently live" index={1} />
          <StatCard label="Total Applications" value={applications} icon={Users} variant="emerald" index={2} />
          <StatCard label="Total Views" value={views} icon={Eye} variant="violet" index={3} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <AdminJobsTable onDataChange={() => setRefreshKey((k) => k + 1)} />
        </motion.div>
      </div>
    </div>
  );
}
