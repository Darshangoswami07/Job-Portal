import React, { useState } from "react";
import Navbar from "../shared/Navbar";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { JOB_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import useGetAllCompanies from "@/hooks/useGetAllCompanies";
import { useSelector } from "react-redux";

export default function AdminJobCreate() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
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

  useGetAllCompanies();
  const { companies = [] } = useSelector((store) => store.company || {});

  const changeHandler = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        description: form.description,
        requirements: form.requirements,
        location: form.location,
        jobType: form.jobType,
        salary: form.salary,
        experience: form.experience,
        position: form.position,
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto py-10 px-4">

        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Create New Job
        </h1>

        <div className="bg-white shadow-lg rounded-xl p-8 border">

          {companies.length === 0 && (
            <p className="text-red-600 font-semibold mb-6">
              ⚠ Please register a company first before creating a job.
            </p>
          )}

          <form onSubmit={submitHandler} className="space-y-6">

            <div className="grid md:grid-cols-2 gap-6">

              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input
                  name="title"
                  value={form.title}
                  onChange={changeHandler}
                  placeholder="Frontend Developer"
                />
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  name="location"
                  value={form.location}
                  onChange={changeHandler}
                  placeholder="Delhi / Remote"
                />
              </div>

              <div className="space-y-2">
                <Label>Job Type</Label>
                <Input
                  name="jobType"
                  value={form.jobType}
                  onChange={changeHandler}
                  placeholder="Full Time / Internship"
                />
              </div>

              <div className="space-y-2">
                <Label>Salary</Label>
                <Input
                  type="number"
                  name="salary"
                  value={form.salary}
                  onChange={changeHandler}
                  placeholder="50000"
                />
              </div>

              <div className="space-y-2">
                <Label>Experience Level</Label>
                <Input
                  type="number"
                  name="experience"
                  value={form.experience}
                  onChange={changeHandler}
                  placeholder="2"
                />
              </div>

              <div className="space-y-2">
                <Label>Open Positions</Label>
                <Input
                  type="number"
                  name="position"
                  value={form.position}
                  onChange={changeHandler}
                  placeholder="3"
                />
              </div>

              <div className="space-y-2">
                <Label>Company</Label>
                <select
                  name="companyId"
                  value={form.companyId}
                  onChange={changeHandler}
                  className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">Select a company</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                name="description"
                value={form.description}
                onChange={changeHandler}
                className="w-full border rounded-md p-3"
                placeholder="Write job description..."
              />
            </div>

            <div className="space-y-2">
              <Label>Requirements (comma separated)</Label>
              <Input
                name="requirements"
                value={form.requirements}
                onChange={changeHandler}
                placeholder="React, Node.js, MongoDB"
              />
            </div>

            <div className="flex gap-4 pt-4">

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/jobs")}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={companies.length === 0}
                className="bg-black text-white hover:bg-gray-800"
              >
                Create Job
              </Button>

            </div>

          </form>
        </div>
      </div>
    </div>
  );
}