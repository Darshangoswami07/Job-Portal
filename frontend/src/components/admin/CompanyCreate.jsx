import React, { useState } from "react";
import Navbar from "@/components/shared/Navbar";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { COMPANY_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { setSingleCompany } from "@/store/slices/companySlice";
import CompanyForm from "@/components/recruiter/CompanyForm";

export default function CompanyCreate() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [submitting, setSubmitting] = useState(false);

  const registerNewCompany = async (companyName) => {
    try {
      setSubmitting(true);
      const res = await axios.post(
        `${COMPANY_API_END_POINT}/register`,
        { companyName },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      if (res?.data?.success) {
        dispatch(setSingleCompany(res.data.company));
        toast.success(res.data.message);
        const companyId = res?.data?.company?._id;
        navigate(`/admin/companies/${companyId}`);
      }
    } catch (error) {
      const errorMessage = error?.response?.data?.message || "Failed to register company";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <CompanyForm
          mode="create"
          onSubmit={registerNewCompany}
          submitting={submitting}
        />
      </div>
    </div>
  );
}
