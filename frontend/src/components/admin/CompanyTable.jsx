import React, { useMemo } from "react";
import { motion as Motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Edit2, MoreHorizontal } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function CompanyTable() {
  const { companies = [], searchCompanyByText = "" } =
  useSelector((store) => store.company || {});
  const navigate=useNavigate();
  const filteredCompanies = useMemo(() => {
  if (!searchCompanyByText) return companies;

  return companies.filter((company) =>
    company?.name
      ?.toLowerCase()
      .includes(searchCompanyByText.toLowerCase())
  );
}, [companies, searchCompanyByText]);
  return (
    <div className="overflow-hidden rounded-[2rem] bg-white p-4 shadow-[0_35px_80px_-40px_rgba(15,23,42,0.15)] sm:p-6">
      <Table className="min-w-full divide-y divide-slate-200 bg-white">
        <TableCaption className="text-left text-sm text-slate-500">
          A list of your recently registered companies.
        </TableCaption>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">Logo</TableHead>
            <TableHead className="py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">Name</TableHead>
            <TableHead className="py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">Date</TableHead>
            <TableHead className="py-4 text-right text-sm font-semibold uppercase tracking-wide text-slate-500">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-sm text-slate-500">
                No companies registered yet.
              </TableCell>
            </TableRow>
          ) : (
            filteredCompanies.map((company) => (
              <Motion.tr
                key={company._id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                whileHover={{ y: -2 }}
                className="group border-b border-slate-200 bg-white transition duration-300 hover:bg-slate-50"
              >
                <TableCell className="py-4">
                  <div className="inline-flex items-center justify-center rounded-full bg-slate-100 p-2 shadow-sm ring-1 ring-slate-200 transition duration-300 group-hover:bg-blue-50">
                    <Avatar className="shadow-none ring-0">
                      <AvatarImage src={company.logo} />
                    </Avatar>
                  </div>
                </TableCell>

                <TableCell className="py-4 text-sm font-semibold text-slate-900">{company.name}</TableCell>

                <TableCell className="py-4 text-sm text-slate-500">{company.createdAt?.split("T")[0]}</TableCell>

                <TableCell className="py-4 text-right">
                  <Popover>
                    <PopoverTrigger>
                      <MoreHorizontal className="text-slate-500 transition hover:text-slate-900" />
                    </PopoverTrigger>
                    <PopoverContent className="w-36 rounded-3xl bg-white p-3 shadow-2xl ring-1 ring-slate-200">
                      <div
                        onClick={() => navigate(`/admin/companies/${company._id}`)}
                        className="flex items-center gap-2 w-fit cursor-pointer text-sm text-slate-700 transition hover:text-slate-900"
                      >
                        <Edit2 className="w-4" />
                        <span>Edit</span>
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableCell>
              </Motion.tr>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
