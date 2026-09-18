import React, { useState } from "react";
import Navbar from "@/components/shared/Navbar";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { JOB_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import useGetAllCompanies from "@/hooks/useGetAllCompanies";
import { useSelector } from "react-redux";
import JobForm from "@/components/recruiter/JobForm";
import { Plus } from "lucide-react";

export default function AdminJobCreate() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  useGetAllCompanies();
  const { companies = [] } = useSelector((store) => store.company || {});

  const handleSubmit = async (payload) => {
    try {
      setSubmitting(true);
      const res = await axios.post(`${JOB_API_END_POINT}/post`, payload, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setTimeout(() => navigate("/admin/jobs"), 400);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create job");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <JobForm
          mode="create"
          companies={companies}
          onSubmit={handleSubmit}
          submitting={submitting}
          key="create"
        />
      </div>
    </div>
  );
}
