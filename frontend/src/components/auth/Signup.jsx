import React, { useState } from "react";
import Navbar from "../shared/Navbar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup } from "../ui/radio-group";
import { Button } from "../ui/button";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { USER_API_END_POINT } from "../utils/constant";
import { toast } from "sonner";

export default function Signup() {
  const [input, setInput] = useState({
    fullname: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "",
    file: "",
  });
  const navigate = useNavigate();
  function changeEventHandler(e) {
    setInput({ ...input, [e.target.name]: e.target.value });
  }
  const chnageFileHandler = (e) => {
    setInput({ ...input, file: e.target.files?.[0] });
  };
  const submitHandler = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("fullname", input.fullname);
    formData.append("email", input.email);
    formData.append("phoneNumber", input.phoneNumber);
    formData.append("password", input.password);
    formData.append("role", input.role);

    if (input.file) {
      formData.append("file", input.file);
    }

    try {
      const res = await axios.post(`${USER_API_END_POINT}/register`, formData, {
        withCredentials: true,
      });

      if (res.data.success) {
        toast.success(res.data.message);

        setInput({
          fullname: "",
          email: "",
          phoneNumber: "",
          password: "",
          role: "",
          file: "",
        });

        navigate("/login");
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="flex items-center justify-center max-w-7xl mx-auto">
        <form
          onSubmit={submitHandler}
          className="w-1/2 border-gray-400 rounded-md p-4 my-10 "
        >
          <h1 className="font-bold text-xl mb-5">Signup</h1>
          <div className="my-2">
            <Label>Fullname</Label>
            <Input
              type="text"
              value={input.fullname}
              onChange={changeEventHandler}
              name="fullname"
              placeholder="Enter your fullname"
            />
          </div>
          <div className="my-2">
            <Label>Email</Label>
            <Input
              type="text"
              value={input.email}
              onChange={changeEventHandler}
              name="email"
              placeholder="Darshan@gmail.com"
            />
          </div>
          <div>
            <Label>Phone Number</Label>
            <Input
              type="number"
              value={input.phoneNumber}
              onChange={changeEventHandler}
              name="phoneNumber"
              placeholder="Enter your phone number"
            />
          </div>
          <div className="my-2">
            <Label>Password</Label>
            <Input
              type="password"
              value={input.password}
              onChange={changeEventHandler}
              name="password"
              placeholder="Enter your password"
            />
          </div>
          <div className="flex items-center justify-between">
            <RadioGroup className="flex items-center gap-5 mt-5">
              <div className="flex items-center gap-3">
                <Input
                  type="radio"
                  name="role"
                  value="student"
                  checked={input.role === "student"}
                  onChange={changeEventHandler}
                  className="w-4 h-4 cursor-pointer"
                />
                <Label htmlFor="r1">Student</Label>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="radio"
                  name="role"
                  value="recruiter"
                  checked={input.role === "recruiter"}
                  onChange={changeEventHandler}
                  className="w-4 h-4 cursor-pointer"
                />
                <Label htmlFor="r2">Recruiter</Label>
              </div>
            </RadioGroup>
            <div className="flex item-center gap-2">
              <Label>Profile</Label>
              <Input
                accept="image/*"
                type="file"
                onChange={chnageFileHandler}
                placeholder="Upload your profile picture"
                className="cursor-pointer"
              />
            </div>
          </div>
          <Button className="w-full my-4 cursor-pointer" type="submit">
            Signup
          </Button>
          <span className="text-sm">
            already have an account?{" "}
            <Link to="/login" className="text-blue-600">
              Login
            </Link>
          </span>
        </form>
      </div>
    </div>
  );
}
