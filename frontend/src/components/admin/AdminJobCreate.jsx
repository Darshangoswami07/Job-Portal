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

  // load companies so user can choose which one the job belongs to
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
      console.log(error);
      const msg = error?.response?.data?.message || "Failed to create job";
      toast.error(msg);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="max-w-4xl mx-auto my-10">
        <h1 className="font-bold text-xl mb-4">Create New Job</h1>
        <form onSubmit={submitHandler} className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              name="title"
              value={form.title}
              onChange={changeHandler}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Input
              name="description"
              value={form.description}
              onChange={changeHandler}
            />
          </div>
          <div>
            <Label>Requirements (comma separated)</Label>
            <Input
              name="requirements"
              value={form.requirements}
              onChange={changeHandler}
            />
          </div>
          <div>
            <Label>Location</Label>
            <Input
              name="location"
              value={form.location}
              onChange={changeHandler}
            />
          </div>
          <div>
            <Label>Job Type</Label>
            <Input
              name="jobType"
              value={form.jobType}
              onChange={changeHandler}
            />
          </div>
          <div>
            <Label>Salary</Label>
            <Input
              name="salary"
              type="number"
              value={form.salary}
              onChange={changeHandler}
            />
          </div>
          <div>
            <Label>Experience Level</Label>
            <Input
              name="experience"
              type="number"
              value={form.experience}
              onChange={changeHandler}
            />
          </div>
          <div>
            <Label>Open Positions</Label>
            <Input
              name="position"
              type="number"
              value={form.position}
              onChange={changeHandler}
            />
          </div>
          <div>
            <Label>Company</Label>
            <select
              name="companyId"
              value={form.companyId}
              onChange={changeHandler}
              className="block w-full p-2 border rounded"
            >
              <option value="">Select a company</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/admin/jobs")}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </div>
    </div>
  );
}