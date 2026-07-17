import React, { useEffect, useState } from "react";
import Navbar from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { COMPANY_API_END_POINT } from "@/utils/constant";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import useGetCompanyById from "@/hooks/useGetCompanyById";

export default function CompanySetup() {
  const params = useParams();
  useGetCompanyById(params.id);
  const [input, setInput] = useState({
    name: "",
    description: "",
    website: "",
    location: "",
    file: null,
  });
  const { singleCompany } = useSelector((store) => store.company);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const changeEventHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };
  const changeFileHandler = (e) => {
    const file = e.target.files?.[0];
    setInput({ ...input, file });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", input.name);
    formData.append("description", input.description);
    formData.append("website", input.website);
    formData.append("location", input.location);
    if (input.file) formData.append("file", input.file);

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

  useEffect(() => {
    if (singleCompany) {
      setInput({
        name: singleCompany.name || "",
        description: singleCompany.description || "",
        website: singleCompany.website || "",
        location: singleCompany.location || "",
        file: null,
      });
    }
  }, [singleCompany]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <form onSubmit={submitHandler}>
          <div className="flex items-center gap-4 mb-6">
            <Button
              type="button"
              variant="outline"
              className="btn-secondary rounded-lg p-2.5"
              onClick={() => navigate("/admin/companies")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900">Company Setup</h1>
          </div>
          <div className="bg-white card-shadow rounded-lg p-8 space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Company Name</Label>
                <Input type="text" name="name" value={input.name} onChange={changeEventHandler} className="rounded-lg border-gray-200" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Description</Label>
                <Input type="text" name="description" value={input.description} onChange={changeEventHandler} className="rounded-lg border-gray-200" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Website</Label>
                <Input type="text" name="website" value={input.website} onChange={changeEventHandler} className="rounded-lg border-gray-200" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Location</Label>
                <Input type="text" name="location" value={input.location} onChange={changeEventHandler} className="rounded-lg border-gray-200" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Logo</Label>
                <Input type="file" accept="image/*" onChange={changeFileHandler} className="rounded-lg border-gray-200" />
              </div>
            </div>
            {loading ? (
              <Button className="w-full btn-primary rounded-lg py-2.5" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </Button>
            ) : (
              <Button type="submit" className="w-full btn-primary rounded-lg py-2.5">
                Update
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
