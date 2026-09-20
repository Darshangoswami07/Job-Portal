import React, { useState } from "react";
import Navbar from "@/components/shared/Navbar";
import axios from "axios";
import { COMPANY_API_END_POINT } from "@/utils/constant";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import useGetCompanyById from "@/hooks/useGetCompanyById";
import CompanyForm from "@/components/recruiter/CompanyForm";
import { SkeletonForm } from "@/components/recruiter/Skeleton";

export default function CompanySetup() {
  const params = useParams();
  useGetCompanyById(params.id);
  const { singleCompany } = useSelector((store) => store.company || {});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submitHandler = async (formData) => {
    try {
      setLoading(true);
      const res = await axios.put(
        `${COMPANY_API_END_POINT}/update/${params.id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" }, withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        navigate("/admin/companies");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        {singleCompany ? (
          <CompanyForm
            key={singleCompany._id}
            mode="edit"
            initial={singleCompany}
            onSubmit={submitHandler}
            submitting={loading}
          />
        ) : (
          <SkeletonForm rows={5} />
        )}
      </div>
    </div>
  );
}
