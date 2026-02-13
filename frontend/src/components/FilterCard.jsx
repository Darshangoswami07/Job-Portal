import { RadioGroup, RadioGroupItem } from "./ui/Radio-Group";
import React from "react";

const filterData = [
  {
    filterType: "Location",
    array: ["Delhi NCR", "Bangalore", "Hyderabad", "Pune", "Mumbai"],
  },
  {
    filterType: "Industry",
    array: ["frontend", "backend", "fullstack", "devops", "data science"],
  },
  {
    filterType: "Salary Range",
    array: ["0-40k", "42-1lakh", "1-5lakh"],
  },
];

export default function FilterCard() {
  return (
    <div className="w-full bg-white p-3 rounded-b-md">
      <h1 className="text-xl font-bold">Filter Job</h1>
      <hr className="mt-3" />
      <RadioGroup>
     {
        filterData.map((data, index) => (
            <div>
                <h1 className="font-bold text-lg">{data.filterType}</h1>
                {
                    data.array.map((item,index)=>{
                        return(
                        <div className="flex items-center space-x-2 my-2">
                            <RadioGroupItem value={item} />
                            <label >
                                {item}
                            </label>
                        </div>
                    )})
                }
            </div>
        ))
     }
      </RadioGroup>
    </div>
  );
}
