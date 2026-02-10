import React from "react";
import Navbar from "../shared/Navbar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";


export default function Signup() {
  return (
    <div>
      <Navbar />
      <div className="flex items-center justify-center max-w-7xl mx-auto">
        <form action="" className="w-1/2 border-gray-400 rounded-md p-4 my-10 ">
          <h1 className="font-bold text-xl mb-5">Signup</h1>
          <div>
            <Label>Fullname</Label>
            <Input type="text" placeholder="Enter your fullname" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" placeholder="Darshan@gmail.com" />
          </div>
          <div>
            <Label>Phone Number</Label>
            <Input type="number" placeholder="Enter your phone number" />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" placeholder="Enter your password" />
          </div>
          <div className="flex">

          </div>
        </form>
      </div>
    </div>
  );
}
