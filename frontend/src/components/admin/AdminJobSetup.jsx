import React, { useEffect, useState } from "react";
import Navbar from "../shared/Navbar";
import { Button } from "../ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
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
    <div>
      <Navbar />
      <div className="max-w-xl mx-auto my-10">
        <form onSubmit={submitHandler}>
          <div className="flex items-center gap-5 p-8">
            <Button
              onClick={() => navigate("/admin/jobs")}
              variant="outline"
              className="flex items-center gap-2 text-gray-500 font-semibold"
            >
              <ArrowLeft />
              <span>Back</span>
            </Button>
            <h1 className="font-bold text-xl">Job Setup </h1>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Title</Label>
              <Input
                type="text"
                name="title"
                value={input.title}
                onChange={changeHandler}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                type="text"
                name="description"
                value={input.description}
                onChange={changeHandler}
              />
            </div>
            <div>
              <Label>Requirements</Label>
              <Input
                type="text"
                name="requirements"
                value={input.requirements}
                onChange={changeHandler}
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                type="text"
                name="location"
                value={input.location}
                onChange={changeHandler}
              />
            </div>
            <div>
              <Label>Job Type</Label>
              <Input
                type="text"
                name="jobType"
                value={input.jobType}
                onChange={changeHandler}
              />
            </div>
            <div>
              <Label>Salary</Label>
              <Input
                type="number"
                name="salary"
                value={input.salary}
                onChange={changeHandler}
              />
            </div>
            <div>
              <Label>Experience Level</Label>
              <Input
                type="number"
                name="experience"
                value={input.experience}
                onChange={changeHandler}
              />
            </div>
            <div>
              <Label>Open Positions</Label>
              <Input
                type="number"
                name="position"
                value={input.position}
                onChange={changeHandler}
              />
            </div>
            <div>
              <Label>Company</Label>
              <select
                name="companyId"
                value={input.companyId}
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
          </div>
          {loading ? (
            <Button className="w-full my-4">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              please wait
            </Button>
          ) : (
            <Button className="w-full my-4" type="submit">
              Update
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}