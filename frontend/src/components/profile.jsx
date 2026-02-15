import React, { useState } from "react";
import Navbar from "./shared/Navbar";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Contact, Mail, Pen } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import AppliedJobTable from "./AppliedJobTable";
import UpdateProfileDialogue from "./UpdateProfileDialogue";
import { useSelector } from "react-redux";

// const skills = ["React", "Node.js", "Express", "MongoDB"];
const isHaveResume = true;

export default function Profile() {
    const [open,setOpen]=useState(false);
    const {user}=useSelector(store=>store.auth);
  

  return (
    <div>
      <Navbar />
      <div className="max-w-4xl mx-auto bg-white border border-gray-300 rounded-2xl my-5 p-8">
        <div className="flex justify-between ">
          <div className="flex items-center gap-9">
            <Avatar className="w-24 h-24">
              <AvatarImage
                src="https://tse1.mm.bing.net/th/id/OIP.Tlxk3lOkAZgk5_8_03A8MwAAAA?rs=1&pid=ImgDetMain&o=7&rm=3"
                alt="Profile Picture"
              />
            </Avatar>
            <div>
              <h1 className="text-xl font-medium mt-2">{user?.fullname}</h1>
              <p>
                {user?.profile?.bio}
              </p>
            </div>
          </div>
          <Button onClick={()=>setOpen(true)} className="text-right " variant="outline">
            <Pen />
          </Button>
        </div>
        <div className="my-5">
          <div className="flex gap-3 items-center my-2">
            <Mail />
            <span>{user?.email}</span>
          </div>
          <div className="flex gap-3 items-center my-2">
            <Contact />
            <span className="ml-2">{user?.phoneNumber}</span>
          </div>
        </div>
        <div className="my-5">
          <h1 className="text-xl font-medium">Skills</h1>
          <div className="flex items-center gap-1">
            {user?.profile?.skills.length !== 0 ? (
              user?.profile?.skills.map((item, index) => (
                <Badge key={index} className="mr-2">
                  {item}
                </Badge>
              ))
            ) : (
              <span>No skills added</span>
            )}
          </div>
        </div>
        <div className="grid w-full  max-w-sm item-center gap-1.5">
          <Label className="text-md font-bold">Resume</Label>
          {isHaveResume ? (
            <a
              href=" https://google.com "
              target="blank"
              className="text-blue-500 w-full hover:underline cursor-pointer"
            >
              {" "}
              Darshan cv
            </a>
          ) : (
            <span>No resume uploaded</span>
          )}
        </div>
      </div>
      <div className="max-w-4xl mx-auto bg-white rounded-2xl ">
        <h1 className="font-bold text-lg my-5">Applied Job</h1>
        <AppliedJobTable />
      </div>
      <UpdateProfileDialogue open={open} setOpen={setOpen}/>
    </div>
  );
}
