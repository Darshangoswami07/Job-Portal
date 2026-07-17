import React, { useState } from "react";
import Navbar from "@/components/shared/Navbar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { COMPANY_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { setSingleCompany } from "@/store/slices/companySlice";

export default function CompanyCreate() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const dispatch = useDispatch();

  const registerNewCompany = async () => {
    try {
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
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white card-shadow rounded-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Company Name</h1>
          <p className="text-sm text-gray-500 mb-6">
            What would you like to name your company? You can change this later.
          </p>
          <Label className="text-sm font-medium text-gray-700">Company Name</Label>
          <Input
            type="text"
            className="mt-1.5 rounded-lg border-gray-200 focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20"
            placeholder="e.g. Acme Corp"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
          <div className="flex items-center gap-3 mt-8">
            <Button
              variant="outline"
              className="btn-secondary rounded-lg px-5 py-2.5 text-sm"
              onClick={() => navigate("/admin/companies")}
            >
              Cancel
            </Button>
            <Button
              className="btn-primary rounded-lg px-5 py-2.5 text-sm"
              onClick={registerNewCompany}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
