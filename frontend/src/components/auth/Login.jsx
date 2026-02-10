import React from "react";
import Navbar from "../shared/Navbar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup } from "../ui/radio-group";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div>
      <Navbar />
      <div className="flex items-center justify-center max-w-7xl mx-auto">
        <form action="" className="w-1/2 border-gray-400 rounded-md p-4 my-10 ">
          <h1 className="font-bold text-xl mb-5">Login</h1>
          <div className="my-2">
            <Label>Email</Label>
            <Input type="email" placeholder="Darshan@gmail.com" />
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
            
          </div>
          <Button className="w-full my-4" type="submit">Login</Button>
          <span className="text-sm">Don't have an account? <Link to="/signup" className="text-blue-600">Signup</Link></span>
        </form>
      </div>
    </div>
  );
}
