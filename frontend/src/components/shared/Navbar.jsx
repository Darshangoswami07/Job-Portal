import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Avatar, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { LogOut, User2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { USER_API_END_POINT } from "../utils/constant";
import { setUser } from "@/redux/authSlice";
import axios from "axios";


export default function Navbar() {
    const {user}=useSelector(store=>store.auth);
    const dispatch=useDispatch();
    const navigate=useNavigate();
    const LogOutHandler = async()=>{
      try{
          const res =await axios.get(`${USER_API_END_POINT}/logout`,{withCredentials:true});
          if(res.data.success){
            dispatch(setUser(null));
            navigate("/");
            toast.success(res.data.message)
          }
      }catch(error){
        console.log(error);
        toast.error(error.response.data.message);
        
      }
    }
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
                  src={user?.profile?.profilePhoto}
                  alt="@shadcn"
                />
              </Avatar>
            </PopoverTrigger>

            <PopoverContent className="w-80 ">
              <div className="flex space-y-3 gap-4">
                <Avatar className="cursor-pointer">
                  <AvatarImage
                    src={user?.profile?.profilePhoto}
                    alt="@shadcn"
                  />
                </Avatar>
                <div>
                  <h4 className="font-medium"> {user?.fullname}</h4>
                  <p className="text-sm text-muted-foreground">
                    {user?.profile?.bio}
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
                <Button onClick={LogOutHandler} variant="link" className="cursor-pointer">Logout</Button>
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
