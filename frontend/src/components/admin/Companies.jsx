import React, { useEffect, useState } from "react";
import Navbar from "@/components/shared/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CompanyTable from "./CompanyTable";
import { useNavigate } from "react-router-dom";
import useGetAllCompanies from "@/hooks/useGetAllCompanies";
import { setSearchCompanyByText } from "@/store/slices/companySlice";
import { useDispatch, useSelector } from "react-redux";
import { Search, Plus, Building2, Briefcase, MapPin, LayoutGrid, List } from "lucide-react";
import PageHeader from "@/components/recruiter/PageHeader";
import StatCard from "@/components/recruiter/StatCard";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Companies() {
  useGetAllCompanies();
  const [input, setInput] = useState("");
  const [view, setView] = useState("grid");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { companies = [] } = useSelector((store) => store.company || {});
  const { allAdminJobs = [] } = useSelector((store) => store.job || {});

  useEffect(() => {
    const t = setTimeout(() => dispatch(setSearchCompanyByText(input)), 200);
    return () => clearTimeout(t);
  }, [input, dispatch]);

  const totalJobs = allAdminJobs.length;
  const totalApplications = allAdminJobs.reduce(
    (s, j) => s + (j.applicantsCount ?? j.applications?.length ?? 0),
    0
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Company Directory"
          title="Companies"
          subtitle="Manage your registered companies, company profiles, and job postings."
          icon={Building2}
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="w-56 rounded-xl pl-9 sm:w-64"
                placeholder="Search companies..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>
            <div className="hidden rounded-xl bg-muted p-1 md:flex">
              {[
                { id: "grid", icon: LayoutGrid },
                { id: "list", icon: List },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={cn(
                    "relative flex size-8 items-center justify-center rounded-[10px] transition",
                    view === v.id ? "text-white" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label={`${v.id} view`}
                >
                  {view === v.id && (
                    <motion.span
                      layoutId="company-view"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="absolute inset-0 rounded-[10px] bg-gradient-to-r from-indigo-500 to-blue-600 shadow"
                    />
                  )}
                  <v.icon className="relative z-10 size-4" />
                </button>
              ))}
            </div>
            <Button
              onClick={() => navigate("/admin/companies/create")}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-blue-700"
            >
              <Plus className="size-4" /> New Company
            </Button>
          </div>
        </PageHeader>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Total Companies" value={companies.length} icon={Building2} variant="indigo" index={0} />
          <StatCard label="Active Jobs" value={totalJobs} icon={Briefcase} variant="violet" index={1} />
          <StatCard label="Applications" value={totalApplications} icon={MapPin} variant="emerald" index={2} />
        </div>

        <CompanyTable view={view} />
      </div>
    </div>
  );
}
