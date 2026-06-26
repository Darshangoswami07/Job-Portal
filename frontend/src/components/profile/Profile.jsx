import React, { useState } from "react";
import Navbar from "@/components/shared/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Contact, Mail, Pen, FileText, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AppliedJobs from "@/components/profile/AppliedJobs";
import UpdateProfileDialogue from "@/components/profile/UpdateProfileDialogue";
import { useSelector } from "react-redux";
import { USER_API_END_POINT } from "@/utils/constant";


const isHaveResume = true;

export default function Profile() {
  const [open, setOpen] = useState(false);
  const [showAppliedJobs, setShowAppliedJobs] = useState(false);
  const { user } = useSelector((store) => store.auth);

  const resumeUrl = `${USER_API_END_POINT}/resume`;

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-100">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-24px_rgba(15,23,42,0.25)]">
          <div className="border-b border-slate-200 px-6 py-4 sm:px-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              View Profile
            </h2>
          </div>
          <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-700 px-6 py-8 sm:px-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <Avatar className="h-24 w-24 ring-4 ring-white/15 shadow-lg">
                  <AvatarImage
                    src={user?.profile?.profilePhoto}
                    alt="Profile Picture"
                  />
                  <AvatarFallback className="bg-slate-200 text-2xl font-semibold text-slate-700">
                    {user?.fullname?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-2 text-white">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                      {user?.fullname}
                    </h1>
                    <Badge className="bg-white/10 text-white hover:bg-white/15">
                      <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                      Profile
                    </Badge>
                  </div>
                  <p className="max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                    {user?.profile?.bio || "No bio added yet."}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setOpen(true)}
                variant="secondary"
                className="shrink-0 self-start bg-white text-slate-900 hover:bg-slate-100"
              >
                <Pen className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                    Contact Details
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Email
                    </p>
                    <p className="mt-2 wrap-break-word text-sm font-medium text-slate-900">
                      {user?.email}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Phone
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {user?.phoneNumber}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                    Resume
                  </h2>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  {isHaveResume ? (
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="wrap-break-word text-sm font-medium text-blue-600 hover:underline"
                    >
                      {user?.profile?.resumeOriginalName}
                    </a>
                  ) : (
                    <span className="text-sm text-slate-600">No resume uploaded</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {user?.profile?.skills.length > 0 ? (
                    user?.profile?.skills.map((item, index) => (
                      <Badge
                        key={index}
                        className="rounded-full bg-slate-900 px-3 py-1 text-white hover:bg-slate-800"
                      >
                        {item}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-slate-600">No skills added</span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Contact className="h-4 w-4 text-slate-500" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                    Quick Summary
                  </h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Full Name
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {user?.fullname}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Bio
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {user?.profile?.bio || "No bio added yet."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8">
          <h2 className="text-lg font-semibold text-slate-900">Saved Jobs</h2>
          <p className="mt-1 text-sm text-slate-600">
            Review jobs you have saved for later.
          </p>
        </div>

        <Button
          className="w-full"
          variant="outline"
          onClick={() => setShowAppliedJobs((prev) => !prev)}
        >
          Applied Jobs
        </Button>

        {showAppliedJobs ? <AppliedJobs /> : null}
      </div>
      <UpdateProfileDialogue open={open} setOpen={setOpen} />
    </div>
  );
}
