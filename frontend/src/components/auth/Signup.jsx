import React from "react";
import Navbar from "../shared/Navbar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";

export default function Signup() {
  return (
    <div>
      <Navbar />
      <div className="flex items-center justify-center max-w-7xl mx-auto">
        <form action="" className="w-1/2 border-gray-400 rounded-md p-4 my-10 ">
          <h1 className="font-bold text-xl mb-5">Signup</h1>
          <div className="my-2">
            <Label>Fullname</Label>
            <Input type="text" placeholder="Enter your fullname" />
          </div>
          <div className="my-2">
            <Label>Email</Label>
            <Input type="email" placeholder="Darshan@gmail.com" />
          </div>
          <div>
            <Label>Phone Number</Label>
            <Input type="number" placeholder="Enter your phone number" />
          </div>
          <div className="my-2">
            <Label>Password</Label>
            <Input type="password" placeholder="Enter your password" />
          </div>
          <div className="flex items-center justify-between">
            <RadioGroup  className="flex items-center gap-5 mt-5">
              <div className="flex items-center gap-3">
                <Input 
                type="radio"
                name="role"
                value="student"
                className="w-4 h-4 cursor-pointer"/>
                <Label htmlFor="r1">Student</Label>
              </div>
              <div className="flex items-center gap-3">
                <Input 
                type="radio"
                name="role"
                value="recruiter"
                className="w-4 h-4 cursor-pointer"/>
                <Label htmlFor="r2">Recruiter</Label>
              </div>
            </RadioGroup>
            <div className="flex item-center gap-2">
                <Label>Profile</Label>
                <Input accept="image/*" type="file" placeholder="Upload your profile picture" className="cursor-pointer"/>
            </div>
          </div>
          <Button className="w-full my-4" type="submit">Signup</Button>
          <span className="text-sm">already have an account? <Link to="/login" className="text-blue-600">Login</Link></span>
        </form>
      </div>
    </div>
  );
}
