import React from "react";

export default function JobSkeleton() {
  return (
    <div
      className="p-5 rounded-b-md shadow-xl bg-white border border-gray-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse"></div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
      </div>
      <div className="mb-4">
        <div className="h-5 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded w-full mb-1 animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
      </div>
      <div className="flex gap-2 mb-4">
        <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded-full w-18 animate-pulse"></div>
      </div>
      <div className="flex gap-4">
        <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
        <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
      </div>
    </div>
  );
}