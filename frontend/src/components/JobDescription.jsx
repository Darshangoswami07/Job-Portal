import React from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export default function JobDescription() {
  const isApplied = true;
  return (
    <div className="max-w-7xl mx-auto my-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-xl ">Frontend Developer</h1>
          <div className="felx items-center gap-2 mt-4">
            <Badge className="text-blue-500 font-bold" variant="ghost">
              12 position
            </Badge>
            <Badge className="text-red-500 font-bold" variant="ghost">
              Part-Time
            </Badge>
            <Badge className="text-purple-600 font-bold" variant="ghost">
              24LPA
            </Badge>
          </div>
        </div>
        <Button
          disabled={isApplied}
          className={`rounded-lg ${isApplied ? "bg-gray-600 cursor-not-allowed" : `bg-purple-500 hover:bg-purple-700`}`}
        >
          {isApplied ? "Already Applied" : "Apply Now"}
        </Button>
      </div>
      <h1 className="border-b-2 border-b-gray-300 font-medium py-4">
        Job Description
      </h1>
      <div className="my-4">
        <h1 className="font-bold my-1">
          Role:{" "}
          <span className="pl-4 font-normal text-gray-800">
            Frontend Developer
          </span>
        </h1>
        <h1 className="font-bold my-1">
          Location:{" "}
          <span className="pl-4 font-normal text-gray-800">Hyderabad</span>
        </h1>
        <h1 className="font-bold my-1">
          Description:{" "}
          <span className="pl-4 font-normal text-gray-800">
            Software Developer and node devloper
          </span>
        </h1>
        <h1 className="font-bold my-1">
          Salary: <span className="pl-4 font-normal text-gray-800">12lpa</span>
        </h1>
        <h1 className="font-bold my-1">
          Total Application:{" "}
          <span className="pl-4 font-normal text-gray-800">4</span>
        </h1>
        <h1 className="font-bold my-1">
          Posted Date:{" "}
          <span className="pl-4 font-normal text-gray-800">15-02-2026</span>
        </h1>
      </div>
    </div>
  );
}
