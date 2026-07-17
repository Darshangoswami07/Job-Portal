import React, { useEffect, useState } from "react";
import Navbar from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { JOB_API_END_POINT } from "@/utils/constant";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import useGetJobById from "@/hooks/useGetJobById";
import useGetAllCompanies from "@/hooks/useGetAllCompanies";

export default function AdminJobSetup() {
  const params = useParams();
  useGetJobById(params.id);
  useGetAllCompanies();

  const { singleJob } = useSelector((store) => store.job || {});
  const { companies = [] } = useSelector((store) => store.company || {});

  const [input, setInput] = useState({
    title: "",
    description: "",
    requirements: "",
    location: "",
    jobType: "",
    salary: "",
    experience: "",
    position: "",
    companyId: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const changeHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (singleJob) {
      setInput({
        title: singleJob.title || "",
        description: singleJob.description || "",
        requirements: (singleJob.requirements || []).join(","),
        location: singleJob.location || "",
        jobType: singleJob.jobType || "",
        salary: singleJob.salary || "",
        experience: singleJob.experienceLevel || "",
        position: singleJob.position || "",
        companyId: singleJob.company?._id || "",
      });
    }
  }, [singleJob]);

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        title: input.title,
        description: input.description,
        requirements: input.requirements,
        location: input.location,
        jobType: input.jobType,
        salary: input.salary,
        experience: input.experience,
        position: input.position,
        companyId: input.companyId,
      };
      const res = await axios.put(
        `${JOB_API_END_POINT}/update/${params.id}`,
        payload,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        navigate("/admin/jobs");
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <form onSubmit={submitHandler}>
          <div className="bg-white card-shadow rounded-lg p-8 sm:p-10">
            <div className="mb-8 flex items-center gap-4">
              <Button
                onClick={() => navigate("/admin/jobs")}
                variant="outline"
                className="btn-secondary flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
                type="button"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Job Setup
                </h1>
                <p className="text-sm text-gray-500">Edit job details</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Title</Label>
                <Input
                  type="text"
                  name="title"
                  value={input.title}
                  onChange={changeHandler}
                  className="w-full rounded-lg border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Location</Label>
                <Input
                  type="text"
                  name="location"
                  value={input.location}
                  onChange={changeHandler}
                  className="w-full rounded-lg border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Job Type</Label>
                <Input
                  type="text"
                  name="jobType"
                  value={input.jobType}
                  onChange={changeHandler}
                  className="w-full rounded-lg border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Salary</Label>
                <Input
                  type="number"
                  name="salary"
                  value={input.salary}
                  onChange={changeHandler}
                  className="w-full rounded-lg border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Experience Level</Label>
                <Input
                  type="number"
                  name="experience"
                  value={input.experience}
                  onChange={changeHandler}
                  className="w-full rounded-lg border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Open Positions</Label>
                <Input
                  type="number"
                  name="position"
                  value={input.position}
                  onChange={changeHandler}
                  className="w-full rounded-lg border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Requirements</Label>
                <Input
                  type="text"
                  name="requirements"
                  value={input.requirements}
                  onChange={changeHandler}
                  className="w-full rounded-lg border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Company</Label>
                <select
                  name="companyId"
                  value={input.companyId}
                  onChange={changeHandler}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20 appearance-none cursor-pointer"
                >
                  <option value="">Select a company</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-medium text-gray-700">Description</Label>
                <textarea
                  name="description"
                  value={input.description}
                  onChange={changeHandler}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20 min-h-[120px] resize-y"
                  placeholder="Write job description..."
                />
              </div>
            </div>

            <div className="mt-8">
              {loading ? (
                <Button className="btn-primary w-full rounded-lg py-2.5 text-sm font-semibold" disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait...
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="btn-primary w-full rounded-lg py-2.5 text-sm font-semibold"
                >
                  Update Job
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
