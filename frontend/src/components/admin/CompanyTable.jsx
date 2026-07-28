import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CompanyLogo } from "@/components/shared/CompanyLogo";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Edit2, MoreHorizontal, Building2 } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function CompanyTable() {
  const { companies = [], searchCompanyByText = "" } = useSelector((store) => store.company || {});
  const navigate = useNavigate();

  const filteredCompanies = React.useMemo(() => {
    if (!searchCompanyByText) return companies;
    return companies.filter((company) =>
      company?.name?.toLowerCase().includes(searchCompanyByText.toLowerCase())
    );
  }, [companies, searchCompanyByText]);

  return (
    <div className="bg-white card-shadow rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Logo</TableHead>
            <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Name</TableHead>
            <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Date</TableHead>
            <TableHead className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCompanies.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-12 text-center">
                <Building2 className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No companies registered yet.</p>
              </TableCell>
            </TableRow>
          ) : (
            filteredCompanies.map((company) => (
              <TableRow key={company._id} className="hover:bg-gray-50 transition-colors">
                <TableCell className="py-3">
                  <CompanyLogo name={company.name} logo={company.logo} className="h-8 w-8 rounded-lg" />
                </TableCell>
                <TableCell className="py-3 text-sm font-medium text-gray-900">{company.name}</TableCell>
                <TableCell className="py-3 text-sm text-gray-500">{company.createdAt?.split("T")[0]}</TableCell>
                <TableCell className="py-3 text-right">
                  <Popover>
                    <PopoverTrigger className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
                      <MoreHorizontal className="h-4 w-4 text-gray-500" />
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-36 p-1.5">
                      <button
                        onClick={() => navigate(`/admin/companies/${company._id}`)}
                        className="flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    </PopoverContent>
                  </Popover>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
