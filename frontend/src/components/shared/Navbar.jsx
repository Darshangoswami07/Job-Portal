import React from "react";
import { Link } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Avatar, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { LogOut, User2 } from "lucide-react";
import { useSelector } from "react-redux";


export default function Navbar() {
    const {user}=useSelector(store=>store.auth);
  return (
    <div className="bg-white ">
      <div className="flex justify-between mx-auto max-w-7xl h-16">
        <div>
          <h1 className="text-2xl font-bold">
            Job <span className="text-red-500">Portal</span>
          </h1>
        </div>
        <div className="flex items-center">
          <ul className="flex font-medium items-center gap-5">
            <li className="inline-block mx-4"><Link to="/">Home</Link></li>
            <li className="inline-block mx-4"><Link to="/jobs">Jobs</Link></li>
            <li className="inline-block mx-4"><Link to="/browse">Browse</Link></li>
          </ul>
            {
                !user ?(
                    <div className="flex items-center gap-2">
                    <Link to="/login"><Button variant="outline">Login</Button></Link>                  
                    <Link to="/signup"><Button className="bg-red-500 hover:bg-red-600">Signup</Button></Link>
                    </div>
                ): <Popover>
            <PopoverTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt="@shadcn"
                />
              </Avatar>
            </PopoverTrigger>

            <PopoverContent className="w-80 ">
              <div className="flex space-y-3 gap-4">
                <Avatar className="cursor-pointer">
                  <AvatarImage
                    src="https://github.com/shadcn.png"
                    alt="@shadcn"
                  />
                </Avatar>
                <div>
                  <h4 className="font-medium">Darshan Goswami</h4>
                  <p className="text-sm text-muted-foreground">
                    full-stack developer
                  </p>
                </div>
              </div>
              <div className="text-gray-400 flex flex-col my-2" >
              <div className="w-fit flex cursor-pointer items-center">
                <User2/>
                <Button variant="link"><Link to="/profile">View Profile</Link></Button>
              </div>
              <div className="flex w-fit cursor-pointer items-center">
                <LogOut/>
                <Button variant="link">Logout</Button>
              </div>
              </div>
            </PopoverContent>
          </Popover>
            }
         
        </div>
      </div>
    </div>
  );
}
