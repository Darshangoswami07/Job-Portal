import React, { useEffect, useState } from "react";
import { motion as Motion } from "framer-motion";
import Navbar from "../shared/Navbar";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { setSearchJobByText } from "@/redux/jobSlice";
import { useDispatch } from "react-redux";
import AdminJobsTable from "./AdminJobsTable";
import useGetAllAdminJobs from "@/hooks/useGetAllAdminJobs";

export default function AdminJobs() {
  useGetAllAdminJobs();
  const [input,setInput]=useState("");
  const navigate =useNavigate();
  const dispatch =useDispatch();

  useEffect(() => {
    // keep filter text in the job slice so it lives alongside the jobs
    dispatch(setSearchJobByText(input));
  }, [input, dispatch]);
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="space-y-6"
        >
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-[0_30px_60px_-36px_rgba(15,23,42,0.25)]">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.32em] text-blue-600">Admin Dashboard</p>
                <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Posted Jobs</h1>
                <p className="max-w-2xl text-sm text-slate-500">
                  Review and manage the current job postings with a premium dashboard experience.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  className="w-full min-w-60 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400"
                  placeholder="Filter By Name"
                  onChange={(e)=>setInput(e.target.value)}
                />
                <Button className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700" onClick={()=>navigate("/admin/jobs/create")}> New Jobs</Button>
              </div>
            </div>
          </div>

          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_60px_-36px_rgba(15,23,42,0.25)]"
          >
            <AdminJobsTable />
          </Motion.div>
        </Motion.div>
      </div>
    </div>
  );
}
