import React, { useState } from "react";
import Navbar from "@/components/shared/Navbar";
import axios from "axios";
import { JOB_API_END_POINT } from "@/utils/constant";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import useGetJobById from "@/hooks/useGetJobById";
import useGetAllCompanies from "@/hooks/useGetAllCompanies";
import JobForm from "@/components/recruiter/JobForm";
import { SkeletonForm } from "@/components/recruiter/Skeleton";

export default function AdminJobSetup() {
  const params = useParams();
  useGetJobById(params.id);
  useGetAllCompanies();

  const { singleJob } = useSelector((store) => store.job || {});
  const { companies = [] } = useSelector((store) => store.company || {});

  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (payload, { silent } = {}) => {
    try {
      setSubmitting(true);
      const res = await axios.put(
        `${JOB_API_END_POINT}/update/${params.id}`,
        payload,
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );
      if (res.data.success) {
        if (!silent) {
          toast.success(res.data.message);
          setTimeout(() => navigate("/admin/jobs"), 500);
        }
      }
      return res;
    } catch (error) {
      if (!silent) toast.error(error?.response?.data?.message || "Update failed");
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  if (!singleJob) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <SkeletonForm rows={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <JobForm
          mode="edit"
          companies={companies}
          initial={singleJob}
          onSubmit={handleSubmit}
          submitting={submitting}
          key={singleJob._id}
        />
      </div>
    </div>
  );
}
