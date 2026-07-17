import React, { useState } from "react";
import Navbar from "@/components/shared/Navbar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { JOB_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import useGetAllCompanies from "@/hooks/useGetAllCompanies";
import { useSelector } from "react-redux";

export default function AdminJobCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "", description: "", requirements: "", location: "",
    jobType: "", salary: "", experience: "", position: "", companyId: "",
  });

  useGetAllCompanies();
  const { companies = [] } = useSelector((store) => store.company || {});

  const changeHandler = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title, description: form.description,
        requirements: form.requirements, location: form.location,
        jobType: form.jobType, salary: form.salary,
        experience: form.experience, position: form.position,
        companyId: form.companyId,
      };
      const res = await axios.post(`${JOB_API_END_POINT}/post`, payload, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        navigate("/admin/jobs");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create job");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Job</h1>
        <div className="bg-white card-shadow rounded-lg p-8">
          {companies.length === 0 && (
            <p className="text-sm font-medium text-red-600 mb-4">Please register a company first before creating a job.</p>
          )}
          <form onSubmit={submitHandler} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Job Title</Label>
                <Input name="title" value={form.title} onChange={changeHandler} placeholder="Frontend Developer" className="rounded-lg border-gray-200" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Location</Label>
                <Input name="location" value={form.location} onChange={changeHandler} placeholder="Delhi / Remote" className="rounded-lg border-gray-200" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Job Type</Label>
                <Input name="jobType" value={form.jobType} onChange={changeHandler} placeholder="Full Time / Internship" className="rounded-lg border-gray-200" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Salary (LPA)</Label>
                <Input type="number" name="salary" value={form.salary} onChange={changeHandler} placeholder="50000" className="rounded-lg border-gray-200" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Experience (years)</Label>
                <Input type="number" name="experience" value={form.experience} onChange={changeHandler} placeholder="2" className="rounded-lg border-gray-200" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Open Positions</Label>
                <Input type="number" name="position" value={form.position} onChange={changeHandler} placeholder="3" className="rounded-lg border-gray-200" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Company</Label>
                <select name="companyId" value={form.companyId} onChange={changeHandler}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20">
                  <option value="">Select a company</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Description</Label>
              <textarea name="description" value={form.description} onChange={changeHandler}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20 min-h-[100px]"
                placeholder="Write job description..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Requirements (comma separated)</Label>
              <Input name="requirements" value={form.requirements} onChange={changeHandler} placeholder="React, Node.js, MongoDB" className="rounded-lg border-gray-200" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="btn-secondary rounded-lg px-5 py-2.5 text-sm"
                onClick={() => navigate("/admin/jobs")}>
                Cancel
              </Button>
              <Button type="submit" disabled={companies.length === 0}
                className="btn-primary rounded-lg px-5 py-2.5 text-sm">
                Create Job
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
