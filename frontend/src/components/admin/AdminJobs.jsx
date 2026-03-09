import React, { useEffect, useState } from "react";
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
    <div>
      <Navbar />
      <div className="max-w-6xl mx-auto my-10 ">
        <div className="flex items-center  justify-between my-5">
          <Input className="w-fit" placeholder="Filter By Name" onChange={(e)=>setInput(e.target.value)} />
          <Button onClick={()=>navigate("/admin/jobs/create")}> New Jobs</Button>
        </div>
        <AdminJobsTable/>
      </div>
    </div>
  );
}
